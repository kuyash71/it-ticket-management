import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import trCommon from "./locales/tr/common.json";

const fallbackLng = "tr";

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon },
      tr: { common: trCommon }
    },
    lng: localStorage.getItem("lang") ?? fallbackLng,
    fallbackLng,
    defaultNS: "common",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
