"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QrCodeBoxProps {
  value: string;
}

export function QrCodeBox({ value }: QrCodeBoxProps) {
  const [svgDataUrl, setSvgDataUrl] = useState<string>("");

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, {
      width: 240,
      margin: 2,
      color: {
        dark: "#090A0C",
        light: "#FFFFFF",
      },
    })
      .then((url) => {
        if (active) setSvgDataUrl(url);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, [value]);

  if (!svgDataUrl) {
    return (
      <div className="h-56 w-56 bg-[#0C0E12] border border-[#232730] flex items-center justify-center font-mono text-xs text-[#68707E]">
        Gerando QR...
      </div>
    );
  }

  return (
    <div className="inline-block bg-white p-3 border-2 border-[#C8FF2E]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={svgDataUrl}
        alt="QR Code Pix para pagamento"
        width={216}
        height={216}
        className="block h-54 w-54"
      />
    </div>
  );
}
