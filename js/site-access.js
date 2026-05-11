/**
 * Accès au site : le mot de passe n’est jamais stocké en clair ici.
 * Seuls un sel (SALT_HEX) et une empreinte PBKDF2 (EXPECTED_HASH_HEX) sont présents.
 *
 * Pour définir ton mot de passe : ouvre en local le fichier outil-hash-acces.html,
 * génère un couple sel / hash, puis remplace SALT_HEX et EXPECTED_HASH_HEX ci-dessous.
 *
 * Limite honnête (tout site 100 % statique) : le HTML/CSS/JS restent téléchargeables ;
 * cette couche repousse les curieux et évite le secret dans le dépôt, mais un attaquant
 * motivé peut tenter une attaque hors ligne sur le hash. Un hébergeur avec mot de passe
 * serveur reste la seule barrière absolue sans chiffrement complet des fichiers.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "rz_portfolio_site_access_v1";
  var PBKDF2_ITERATIONS = 310000;

  /** 16 octets en hex (32 caractères) */
  var SALT_HEX = "a1b2c3d4e5f60718192a2b3c4d5e6f70";
  /** 32 octets dérivés PBKDF2-SHA256, en hex (64 caractères). Régénère avec outil-hash-acces.html si tu changes le mot de passe. */
  var EXPECTED_HASH_HEX =
    "531ced1d7ba2766252513d84d19239325e84eeeb0fab515a43cd45ef1cef111a";

  function hexToBytes(hex) {
    var len = hex.length / 2;
    var out = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return out;
  }

  function timingSafeEqual(a, b) {
    if (a.length !== b.length) {
      return false;
    }
    var d = 0;
    for (var i = 0; i < a.length; i++) {
      d |= a[i] ^ b[i];
    }
    return d === 0;
  }

  function configOk() {
    if (!/^[0-9a-fA-F]{32}$/.test(SALT_HEX) || !/^[0-9a-fA-F]{64}$/.test(EXPECTED_HASH_HEX)) {
      return false;
    }
    return true;
  }

  function isUnlocked() {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  }

  function setUnlocked() {
    sessionStorage.setItem(STORAGE_KEY, "1");
  }

  /** Barre de progression pilotée en JS (fiable sur tous les navigateurs). */
  function runBootProgress(loadingEl, fillEl, ballEl, durationMs, onDone) {
    var startTs = null;
    function frame(now) {
      if (startTs === null) {
        startTs = now;
      }
      var t = Math.min(1, (now - startTs) / durationMs);
      var w = t * 100;
      if (fillEl) {
        fillEl.style.width = w.toFixed(2) + "%";
      }
      if (ballEl && loadingEl) {
        var track = loadingEl.querySelector(".loader");
        if (track) {
          var tw = track.offsetWidth || 300;
          var bw = ballEl.offsetWidth || 20;
          var maxL = Math.max(0, tw - bw);
          var left = -10 + (maxL + 10) * t;
          ballEl.style.left = left + "px";
        }
      }
      if (t < 1) {
        window.requestAnimationFrame(frame);
      } else {
        if (fillEl) {
          fillEl.style.width = "100%";
        }
        onDone();
      }
    }
    window.requestAnimationFrame(frame);
  }

  function derive(password, saltBytes) {
    var enc = new TextEncoder();
    return crypto.subtle
      .importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"])
      .then(function (keyMaterial) {
        return crypto.subtle.deriveBits(
          {
            name: "PBKDF2",
            salt: saltBytes,
            iterations: PBKDF2_ITERATIONS,
            hash: "SHA-256",
          },
          keyMaterial,
          256
        );
      })
      .then(function (buf) {
        return new Uint8Array(buf);
      });
  }

  var overlay = document.getElementById("login-overlay");

  if (!overlay) {
    if (!isUnlocked()) {
      window.location.replace("index.html");
    }
    return;
  }

  if (!configOk()) {
    var bad = document.getElementById("login-error");
    if (bad) {
      bad.style.display = "block";
      bad.textContent =
        "Configuration invalide : vérifie SALT_HEX (32 caractères hex) et EXPECTED_HASH_HEX (64).";
    }
    return;
  }

  if (isUnlocked()) {
    overlay.remove();
    var lsDone = document.querySelector(".loading-screen");
    if (lsDone) {
      lsDone.remove();
    }
    return;
  }

  if (!window.crypto || !window.crypto.subtle) {
    var err = document.getElementById("login-error");
    if (err) {
      err.style.display = "block";
      err.textContent =
        "Navigateur incompatible (crypto). Utilise un navigateur récent.";
    }
    return;
  }

  var errEl = document.getElementById("login-error");
  var input = document.getElementById("password");
  var btn = document.getElementById("login-btn");
  var loading = document.querySelector(".loading-screen");
  var saltBytes = hexToBytes(SALT_HEX);
  var expectedBytes = hexToBytes(EXPECTED_HASH_HEX);

  function showError(visible, msg) {
    if (errEl) {
      errEl.style.display = visible ? "block" : "none";
      if (msg) {
        errEl.textContent = msg;
      }
    }
  }

  function tryLogin() {
    if (!input || (btn && btn.disabled)) {
      return;
    }
    var val = input.value || "";
    if (btn) {
      btn.disabled = true;
    }
    showError(false);

    derive(val, saltBytes)
      .then(function (derived) {
        if (timingSafeEqual(derived, expectedBytes)) {
          showError(false);
          setUnlocked();
          document.documentElement.classList.add("rz-boot-loading");
          overlay.style.display = "none";

          if (loading) {
            loading.style.display = "flex";
            loading.classList.add("is-visible");
            var fill = loading.querySelector(".loader-fill");
            var ball = loading.querySelector(".loader-ball");
            if (fill) {
              fill.style.width = "0%";
            }
            if (ball) {
              ball.style.left = "-10px";
            }

            window.requestAnimationFrame(function () {
              window.requestAnimationFrame(function () {
                runBootProgress(loading, fill, ball, 1000, function () {
                  loading.style.display = "none";
                  loading.classList.remove("is-visible");
                  document.documentElement.classList.remove("rz-boot-loading");
                  if (fill) {
                    fill.style.width = "";
                  }
                  if (ball) {
                    ball.style.left = "";
                  }
                  if (btn) {
                    btn.disabled = false;
                  }
                  if (window.jQuery) {
                    window.jQuery(window).trigger("resize").trigger("scroll");
                  } else {
                    window.dispatchEvent(new Event("resize"));
                  }
                });
              });
            });
          } else {
            document.documentElement.classList.remove("rz-boot-loading");
            if (btn) {
              btn.disabled = false;
            }
          }
        } else {
          showError(true, "Mot de passe incorrect");
          input.value = "";
          input.focus();
          if (btn) {
            btn.disabled = false;
          }
        }
      })
      .catch(function () {
        showError(true, "Erreur technique, réessaie.");
        if (btn) {
          btn.disabled = false;
        }
      });
  }

  if (btn) {
    btn.addEventListener("click", tryLogin);
  }
  if (input) {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        tryLogin();
      }
    });
  }
})();
