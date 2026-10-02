// QR code rendered as crisp SVG. Uses the free, MIT-licensed qrcode-generator.
import qrcode from "qrcode-generator";

export function QR({ text, size = 96 }: { text: string; size?: number }) {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const svg = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  return <span className="qr" style={{ width: size, height: size, display: "inline-block" }} dangerouslySetInnerHTML={{ __html: svg }} />;
}
