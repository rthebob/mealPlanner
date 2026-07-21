import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import type { ShoppingListEntry, AdHocItem } from "./ShoppingList";
import { T } from "../i18n";
import Portal from "./Portal";
import { compressToBase64, decompressFromBase64 } from "./qrCompression";
import "./BasketQRModal.css";

interface BasketPayload {
  entries: {
    meal: {
      id: string;
      name: string;
      serves: number;
      ingredients: import("../types").Ingredient[];
      macros: import("../types").Macros;
    };
    serves: number;
  }[];
  adHocItems: AdHocItem[];
}

interface BasketQRModalProps {
  entries: ShoppingListEntry[];
  adHocItems: AdHocItem[];
  onClose: () => void;
  onLoad: (entries: ShoppingListEntry[], adHocItems: AdHocItem[]) => void;
}

type Tab = "share" | "load";

export default function BasketQRModal({
  entries,
  adHocItems,
  onClose,
  onLoad,
}: BasketQRModalProps) {
  const [tab, setTab] = useState<Tab>("share");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [decodeStatus, setDecodeStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [decodeMessage, setDecodeMessage] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  // Generate QR on mount / entries change
  useEffect(() => {
    const payload: BasketPayload = {
      entries: entries.map(({ meal, serves }) => ({
        meal: {
          id: meal.id,
          name: meal.name,
          serves: meal.serves,
          ingredients: meal.ingredients,
          macros: meal.macros,
        },
        serves,
      })),
      adHocItems,
    };
    const json = JSON.stringify(payload);
    compressToBase64(json).then((compressed) =>
      QRCode.toDataURL(compressed, {
        errorCorrectionLevel: "L",
        width: 300,
        margin: 2,
      })
        .then(setQrDataUrl)
        .catch(() => {
          setQrDataUrl("too-large");
        }),
    );
  }, [entries, adHocItems]);

  // Stop camera when closing or switching tabs
  useEffect(() => {
    return () => stopCamera();
  }, []);

  function stopCamera() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }

  async function startCamera() {
    setCameraError("");
    setDecodeStatus("idle");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      scanFrame();
    } catch {
      setCameraError(T.qrCameraError);
    }
  }

  function scanFrame() {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // Dynamic import jsqr to keep initial bundle lean
    import("jsqr").then(({ default: jsQR }) => {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        stopCamera();
        processQRData(code.data);
      } else {
        rafRef.current = requestAnimationFrame(scanFrame);
      }
    });
  }

  function scanImageAtScale(
    jsQR: (
      data: Uint8ClampedArray,
      width: number,
      height: number,
    ) => { data: string } | null,
    img: HTMLImageElement,
    scale: number,
  ): { data: string } | null {
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    if (w < 64 || h < 64) return null;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);
    return jsQR(imageData.data, imageData.width, imageData.height);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      import("jsqr").then(({ default: jsQR }) => {
        // Try multiple scales so a small QR in a large screenshot is still found.
        // Start at full size, then scale up small images and crop-scan large ones.
        const scales = [1, 1.5, 2, 0.75, 0.5, 3];
        let code: { data: string } | null = null;
        for (const scale of scales) {
          code = scanImageAtScale(jsQR, img, scale);
          if (code) break;
        }
        if (code) {
          processQRData(code.data);
        } else {
          setDecodeStatus("error");
          setDecodeMessage(T.qrNoCode);
        }
      });
    };
    img.src = url;
    e.target.value = "";
  }

  function processQRData(data: string) {
    decompressFromBase64(data)
      .then((decompressed) => {
        try {
          const payload = JSON.parse(decompressed) as BasketPayload;
          if (
            !Array.isArray(payload.entries) ||
            !Array.isArray(payload.adHocItems)
          ) {
            throw new Error("invalid");
          }
          const loadedEntries: ShoppingListEntry[] = payload.entries.map(
            (e) => ({
              meal: {
                ...e.meal,
                procedure: [],
              },
              serves: e.serves,
            }),
          );
          onLoad(loadedEntries, payload.adHocItems);
          setDecodeStatus("success");
          setDecodeMessage(T.qrLoadSuccess);
        } catch {
          setDecodeStatus("error");
          setDecodeMessage(T.qrInvalid);
        }
      })
      .catch(() => {
        setDecodeStatus("error");
        setDecodeMessage(T.qrInvalid);
      });
  }

  const hasContent = entries.length > 0 || adHocItems.length > 0;

  return (
    <Portal>
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-card basket-qr-card"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-actions">
            <span style={{ fontWeight: 700, fontSize: "1.05rem" }}>
              {T.qrTitle}
            </span>
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="basket-qr__tabs">
            <button
              className={`basket-qr__tab${tab === "share" ? " basket-qr__tab--active" : ""}`}
              onClick={() => {
                setTab("share");
                stopCamera();
              }}
            >
              {T.qrShareTab}
            </button>
            <button
              className={`basket-qr__tab${tab === "load" ? " basket-qr__tab--active" : ""}`}
              onClick={() => {
                setTab("load");
                stopCamera();
                setDecodeStatus("idle");
              }}
            >
              {T.qrLoadTab}
            </button>
          </div>

          <div className="modal-card__body basket-qr__body">
            {tab === "share" && (
              <>
                {!hasContent ? (
                  <p className="shopping-empty">{T.qrEmptyBasket}</p>
                ) : qrDataUrl === "too-large" ? (
                  <p className="basket-qr__status basket-qr__status--error">
                    {T.qrTooLarge}
                  </p>
                ) : qrDataUrl ? (
                  <>
                    <p className="basket-qr__hint">{T.qrShareHint}</p>
                    <div className="basket-qr__image-wrap">
                      <img
                        src={qrDataUrl}
                        alt="Basket QR Code"
                        className="basket-qr__image"
                      />
                    </div>
                    <a
                      className="modal-btn modal-btn--save basket-qr__download"
                      href={qrDataUrl}
                      download="basket-qr.png"
                    >
                      {T.qrDownload}
                    </a>
                  </>
                ) : (
                  <p className="shopping-empty">{T.qrGenerating}</p>
                )}
              </>
            )}

            {tab === "load" && (
              <>
                <p className="basket-qr__hint">{T.qrLoadHint}</p>

                {/* Camera scan */}
                <div className="basket-qr__camera-wrap">
                  <video
                    ref={videoRef}
                    className={`basket-qr__video${cameraActive ? " basket-qr__video--active" : ""}`}
                    playsInline
                    muted
                  />
                  {!cameraActive ? (
                    <button
                      className="modal-btn modal-btn--save basket-qr__cam-btn"
                      onClick={startCamera}
                    >
                      {T.qrScanCamera}
                    </button>
                  ) : (
                    <button
                      className="modal-btn modal-btn--cancel basket-qr__cam-btn"
                      onClick={stopCamera}
                    >
                      {T.qrStopCamera}
                    </button>
                  )}
                  {cameraError && (
                    <p className="basket-qr__status basket-qr__status--error">
                      {cameraError}
                    </p>
                  )}
                </div>

                <div className="basket-qr__divider">
                  <span>{T.qrOr}</span>
                </div>

                {/* File upload */}
                <label className="modal-btn basket-qr__upload-label">
                  {T.qrUploadImage}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleFileUpload}
                  />
                </label>

                {decodeStatus !== "idle" && (
                  <p
                    className={`basket-qr__status basket-qr__status--${decodeStatus}`}
                  >
                    {decodeMessage}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}
