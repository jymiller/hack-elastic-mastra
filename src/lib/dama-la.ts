import { toString as createQrSvg } from "qrcode";

export const damaLaPodcastUrl =
  "https://www.youtube.com/playlist?list=PLssfepEyVU-HEEVeIHmKzjDz0a1zirWj1";

export function createDamaLaPodcastQrSvg() {
  return createQrSvg(damaLaPodcastUrl, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 2,
    width: 720,
    color: {
      dark: "#08100cff",
      light: "#ffffffff",
    },
  });
}
