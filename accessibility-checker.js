/**
 * 🎨 Verificador de Contraste y Accesibilidad - Frontend Puro
 * Ejecuta en la consola del navegador sin necesidad de Node.js
 * Valida WCAG 2.1 AA/AAA
 *
 * Uso:
 *   - El script se ejecuta automáticamente cuando se carga la página
 *   - O manualmente: checker.scanPage()
 */

class AccessibilityChecker {
  constructor() {
    this.issues = [];
    this.wcagRatios = {
      AA: 4.5, // Ratio mínimo para AA
      AAA: 7, // Ratio mínimo para AAA
      AALarge: 3, // Ratio para texto grande (18pt+)
      AAALarge: 4.5, // Ratio para texto grande AAA
    };
  }

  /**
   * Convierte color hexadecimal a RGB
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  /**
   * Calcula luminancia relativa (WCAG)
   */
  getLuminance(rgb) {
    if (!rgb) return 0;

    let [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
      val = val / 255;
      return val <= 0.03928
        ? val / 12.92
        : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Calcula ratio de contraste entre dos colores
   */
  getContrastRatio(color1, color2) {
    const lum1 = this.getLuminance(this.hexToRgb(color1));
    const lum2 = this.getLuminance(this.hexToRgb(color2));

    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Convierte rgb/rgba a hex
   */
  rgbToHex(rgb) {
    if (!rgb || rgb === "transparent") return null;

    const matches = rgb.match(/\d+/g);
    if (!matches || matches.length < 3) return null;

    return (
      "#" +
      [
        parseInt(matches[0]).toString(16).padStart(2, "0"),
        parseInt(matches[1]).toString(16).padStart(2, "0"),
        parseInt(matches[2]).toString(16).padStart(2, "0"),
      ]
        .join("")
        .toUpperCase()
    );
  }

  /**
   * Obtiene selector CSS del elemento
   */
  getElementSelector(element) {
    if (element.id) return "#" + element.id;

    let path = [];
    let el = element;
    while (el.parentElement) {
      let selector = el.tagName.toLowerCase();
      if (el.id) {
        selector += "#" + el.id;
        path.unshift(selector);
        break;
      } else {
        if (el.className && typeof el.className === "string") {
          selector += "." + el.className.split(" ").join(".");
        }
        path.unshift(selector);
        el = el.parentElement;
      }
    }
    return path.join(" > ");
  }

  /**
   * Valida contraste de un elemento
   */
  checkElement(element) {
    try {
      const style = window.getComputedStyle(element);
      const textColor = style.color;
      const bgColor = style.backgroundColor;
      const fontSize = parseFloat(style.fontSize);
      const fontWeight = parseInt(style.fontWeight);

      const textColorHex = this.rgbToHex(textColor);
      const bgColorHex = this.rgbToHex(bgColor);

      if (!textColorHex || !bgColorHex || bgColor === "rgba(0, 0, 0, 0)") {
        return null;
      }

      const ratio = this.getContrastRatio(textColorHex, bgColorHex);
      const isLargeText =
        fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);

      const minRatioAA = isLargeText
        ? this.wcagRatios.AALarge
        : this.wcagRatios.AA;
      const minRatioAAA = isLargeText
        ? this.wcagRatios.AAALarge
        : this.wcagRatios.AAA;

      const passAA = ratio >= minRatioAA;
      const passAAA = ratio >= minRatioAAA;

      return {
        element:
          element.tagName + (element.className ? "." + element.className : ""),
        selector: this.getElementSelector(element),
        textColor: textColorHex,
        bgColor: bgColorHex,
        ratio: ratio.toFixed(2),
        fontSize: fontSize.toFixed(1) + "px",
        isLargeText: isLargeText,
        passAA: passAA,
        passAAA: passAAA,
        level: passAAA ? "AAA ✅" : passAA ? "AA ✅" : "FAIL ❌",
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Escanea toda la página
   */
  scanPage() {
    console.clear();
    console.log("🔍 Iniciando escaneo de contraste y accesibilidad...\n");

    const elementsToCheck = document.querySelectorAll(
      "h1, h2, h3, h4, h5, h6, p, button, a, label, input, select, span, div"
    );

    const results = {
      pass: [],
      failAA: [],
      failAAA: [],
    };

    elementsToCheck.forEach((element) => {
      const check = this.checkElement(element);

      if (check) {
        if (check.passAAA) {
          results.pass.push(check);
        } else if (check.passAA) {
          results.failAAA.push(check);
        } else {
          results.failAA.push(check);
        }
      }
    });

    this.displayResults(results);
    return results;
  }

  /**
   * Muestra resultados formateados
   */
  displayResults(results) {
    console.log("=".repeat(80));
    console.log("📊 REPORTE DE ACCESIBILIDAD Y CONTRASTE");
    console.log("=".repeat(80) + "\n");

    const total =
      results.pass.length + results.failAAA.length + results.failAA.length;
    const passPercent =
      total > 0
        ? (
            ((results.pass.length + results.failAAA.length) / total) *
            100
          ).toFixed(1)
        : 0;

    console.log(`📈 RESUMEN:`);
    console.log(`   ✅ Cumple AAA (7.0+): ${results.pass.length}`);
    console.log(`   ⚠️  Cumple AA (4.5+): ${results.failAAA.length}`);
    console.log(`   ❌ No cumple AA: ${results.failAA.length}`);
    console.log(`   📊 Total elementos: ${total}`);
    console.log(`   🎯 Cumplimiento WCAG AA+: ${passPercent}%\n`);

    if (results.failAA.length > 0) {
      console.log("🚨 PROBLEMAS CRÍTICOS (No cumple AA):");
      console.log("-".repeat(80));
      results.failAA.slice(0, 10).forEach((issue, idx) => {
        console.log(`${idx + 1}. ${issue.element}`);
        console.log(`   📍 Selector: ${issue.selector}`);
        console.log(
          `   🎨 Color texto: ${issue.textColor} | Fondo: ${issue.bgColor}`
        );
        console.log(`   📊 Ratio: ${issue.ratio}:1 (Mínimo requerido: 4.5:1)`);
        console.log(
          `   📏 Tamaño: ${issue.fontSize} ${
            issue.isLargeText ? "(Texto grande)" : "(Texto pequeño)"
          }`
        );
        console.log("");
      });
    }

    if (results.failAAA.length > 0) {
      console.log("⚠️  ADVERTENCIAS (Cumple AA pero no AAA):");
      console.log("-".repeat(80));
      results.failAAA.slice(0, 5).forEach((issue, idx) => {
        console.log(`${idx + 1}. ${issue.element} - Ratio: ${issue.ratio}:1`);
      });
      console.log("");
    }

    console.log(
      `✅ ELEMENTOS CON BUEN CONTRASTE: ${results.pass.length} elementos`
    );
    console.log("=".repeat(80) + "\n");

    this.showRecommendations(results);
  }

  /**
   * Muestra recomendaciones de corrección
   */
  showRecommendations(results) {
    if (results.failAA.length === 0) {
      console.log("🎉 ¡Excelente! Toda la página cumple WCAG AA.\n");
      return;
    }

    console.log("💡 RECOMENDACIONES:");
    console.log("-".repeat(80));

    const criticalElements = results.failAA.slice(0, 3);
    console.log("Corrige estos elementos primero:\n");

    criticalElements.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue.selector}`);
      console.log(`   Problema: Ratio ${issue.ratio}:1 < 4.5:1`);
      console.log(`   Opciones:`);
      console.log(`   - Oscurece el texto (usar color más oscuro)`);
      console.log(`   - Aclara el fondo (usar color más claro)`);
      console.log(`   - Aumenta el tamaño de fuente`);
      console.log("");
    });

    console.log("📚 Más información: https://www.w3.org/WAI/WCAG21/quickref/");
    console.log("");
  }

  /**
   * Valida variables CSS
   */
  validateCSSVariables() {
    console.log("\n🎨 VALIDANDO VARIABLES CSS:\n");

    const root = document.documentElement;
    const style = getComputedStyle(root);

    const variables = [
      "--primary-color",
      "--secondary-color",
      "--background-color",
      "--card-background",
      "--text-color",
      "--text-muted",
      "--accent-color",
      "--success-color",
      "--warning-color",
      "--error-color",
    ];

    variables.forEach((varName) => {
      const value = style.getPropertyValue(varName).trim();
      console.log(`${varName}: ${value || "❌ No definida"}`);
    });

    console.log("");
  }
}

// Exportar globalmente
window.AccessibilityChecker = AccessibilityChecker;

// Ejecutar automáticamente al cargar
(function () {
  const runScan = () => {
    const checker = new AccessibilityChecker();
    checker.scanPage();
    checker.validateCSSVariables();
    window.checker = checker;
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runScan);
  } else {
    runScan();
  }
})();
