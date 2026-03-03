import { useMemo, useRef, useState } from "react";

interface ScanResponse {
  vehicleDetected: boolean;
  vehicleConfidence: number;
  detectedRego: string;
  regoConfidence: number;
  lookupDetails: {
    make: string | null;
    model: string | null;
    year: number | null;
    color: string | null;
    stolenFlag: "true" | "false" | "unknown";
    source: string;
  } | null;
  visualAttributes: {
    make: string | null;
    model: string | null;
    color: string | null;
  };
  matchScore: number;
  status: "No Vehicle Detected" | "Rego Not Detected" | "Likely Same" | "Manual Review" | "Possible Mismatch";
  notes: string[];
}

const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";

export default function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [streamReady, setStreamReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string>("");

  const statusClass = useMemo(() => {
    if (!result) return "badge";
    if (result.status === "No Vehicle Detected") return "badge badge-gray";
    if (result.status === "Rego Not Detected") return "badge badge-gray";
    if (result.status === "Likely Same") return "badge badge-green";
    if (result.status === "Manual Review") return "badge badge-amber";
    return "badge badge-red";
  }, [result]);

  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });

      if (!videoRef.current) {
        setError("Video element is not ready");
        return;
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setStreamReady(true);
    } catch (cameraError) {
      setError(cameraError instanceof Error ? cameraError.message : "Failed to start camera");
    }
  };

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError("Camera is not initialized");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas context is unavailable");
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frameDataUrl = canvas.toDataURL("image/jpeg", 0.9);

      const response = await fetch(`${backendUrl}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frameDataUrl })
      });

      if (!response.ok) {
        throw new Error(`Backend scan failed (${response.status})`);
      }

      const payload = (await response.json()) as ScanResponse;
      setResult(payload);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <h1>Rego Detector NZ</h1>
      <p>TypeScript MVP: webcam capture → rego lookup → match score</p>

      <div className="controls">
        <button onClick={startCamera} disabled={streamReady}>
          {streamReady ? "Camera Ready" : "Start Camera"}
        </button>
        <button onClick={captureAndScan} disabled={!streamReady || loading}>
          {loading ? "Scanning..." : "Capture & Scan"}
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <video ref={videoRef} className="video" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />

      {result ? (
        <section className="card">
          <h2>Scan Result</h2>
          <p>
            <strong>Vehicle Detected:</strong> {result.vehicleDetected ? "Yes" : "No"} ({Math.round(result.vehicleConfidence * 100)}%)
          </p>
          <p>
            <strong>Detected Rego:</strong> {result.detectedRego} ({Math.round(result.regoConfidence * 100)}%)
          </p>
          <p>
            <strong>Lookup:</strong>{" "}
            {result.lookupDetails
              ? `${result.lookupDetails.make ?? "-"} ${result.lookupDetails.model ?? "-"} ${result.lookupDetails.color ?? "-"}`
              : "-"}
          </p>
          <p>
            <strong>Observed:</strong> {result.visualAttributes.make ?? "-"} {result.visualAttributes.model ?? "-"} {result.visualAttributes.color ?? "-"}
          </p>
          <p>
            <strong>Match Score:</strong> {Math.round(result.matchScore * 100)}%
          </p>
          <p>
            <strong>Status:</strong> <span className={statusClass}>{result.status}</span>
          </p>
          <p>
            <strong>Stolen Flag:</strong> {result.lookupDetails?.stolenFlag ?? "-"}
          </p>
          <p>
            <strong>Source:</strong> {result.lookupDetails?.source ?? "-"}
          </p>
          {result.notes.length > 0 ? (
            <ul>
              {result.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
