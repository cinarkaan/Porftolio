(function () {
    const bypassForMe = false; // Test için true yapabilirsiniz.

    if (bypassForMe) {
        console.log("Developer Mode Is Enabled: Regional Blocking bypassed.");
        return;
    }

    // =========================================================
    // 1. ENGELLENECEK TIMEZONE'LAR (VPN Açılsa Bile Cihazda Değişmez)
    // =========================================================

    const blockedTimeZones = [
        "Europe/Istanbul",
        "Asia/Istanbul",
        "Asia/Shanghai",
        "Asia/Chongqing",
        "Asia/Harbin",
        "Asia/Urumqi",
        "Europe/Moscow",
        "Asia/Pyongyang",
        "Asia/Tehran"
    ];

    // =========================================================
    // 2. ENGELLENECEK ÜLKELER (Doğrudan Bağlantılar İçin)
    // =========================================================

    const blockedCountryCodes = [
        "TR",
        "CN",
        "RU",
        "KP",
        "IR"
    ];

    // Sayfayı ilk anda gizle
    document.documentElement.style.visibility = "hidden";

    // =========================================================
    // KATMAN 1: TIMEZONE KONTROLÜ (TR + VPN Kullanıcılarını Yakalar)
    // =========================================================

    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";

    if (blockedTimeZones.includes(userTimeZone)) {
        blockAccess("REGIONAL_TIMEZONE");
        return;
    }

    // =========================================================
    // KATMAN 2: TARAYICI DİLİ + VPN KONTROLÜ (Ek Sıkılaştırma)
    // =========================================================

    const userLanguages = navigator.languages || [navigator.language || ""];
    const hasTurkishLanguage = userLanguages.some(lang => lang.toLowerCase().startsWith("tr"));

    // =========================================================
    // KATMAN 3: IP / LOKASYON / PROXY KONTROLÜ
    // =========================================================

    checkRegion();

    async function checkRegion() {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        try {
            // Public IP Al
            const ipResponse = await fetch("https://api.ipquery.io/", {
                method: "GET",
                cache: "no-store",
                signal: controller.signal
            });

            if (!ipResponse.ok) throw new Error("IP API Error");
            const ipAddress = (await ipResponse.text()).trim();

            // IP Detaylarını Al
            const regionResponse = await fetch(`https://api.ipquery.io/${encodeURIComponent(ipAddress)}`, {
                method: "GET",
                cache: "no-store",
                signal: controller.signal
            });

            if (!regionResponse.ok) throw new Error("Region API Error");
            const data = await regionResponse.json();

            if (!data || !data.location || !data.risk) {
                throw new Error("Invalid API Response");
            }

            const countryCode = (data.location.country_code || "").toUpperCase();
            const isVPN = data.risk.is_vpn === true;
            const isProxy = data.risk.is_proxy === true;
            const isTor = data.risk.is_tor === true;

            // A) Tor Ağları Kesin Engellenir
            if (isTor) {
                blockAccess("TOR_DETECTED");
                return;
            }

            // B) Doğrudan TR IP'leri Engellenir (VPN'siz TR Bağlantıları)
            if (blockedCountryCodes.includes(countryCode)) {
                blockAccess("REGIONAL_LOCATION");
                return;
            }

            // C) VPN Kullanılıyor + Tarayıcı Dili Türkçe (VPN Arkasına Saklanan TR Kullanıcıları)
            if ((isVPN || isProxy) && hasTurkishLanguage) {
                blockAccess("SUSPICIOUS_VPN_USER");
                return;
            }

            // D) AB Şirket VPN'leri veya Temiz Trafik Geçer
            clearTimeout(timeout);
            document.documentElement.style.visibility = "visible";

            console.log("Erişim Onaylandı:", {
                country: countryCode,
                timezone: userTimeZone,
                vpn: isVPN
            });

        } catch (error) {
            clearTimeout(timeout);
            // API çökerse varsayılan olarak aç (Fail Open)
            console.warn("Bölge doğrulaması yapılamadı:", error);
            document.documentElement.style.visibility = "visible";
        }
    }

    // =========================================================
    // ENGEL EKRANI
    // =========================================================

    function blockAccess(reason) {
        const renderBlockPage = () => {
            document.documentElement.style.visibility = "visible";
            document.body.innerHTML = `
                <div class="error-card">
                    <div class="icon">📍</div>
                    <h1>403 | REGIONAL ACCESS DENIED</h1>
                    <p>This site is not accessible from your location or network environment.</p>
                    <div class="badge">ERROR_CODE: BLOCKED_${reason}</div>
                </div>
            `;

            const style = document.createElement("style");
            style.textContent = `
                body {
                    background-color: #0b0f17 !important;
                    color: #f0f6fc !important;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                    height: 100vh !important;
                    margin: 0 !important;
                }
                .error-card {
                    background: #161b22;
                    border: 1px solid #30363d;
                    border-radius: 12px;
                    padding: 40px 30px;
                    max-width: 450px;
                    text-align: center;
                }
                .icon { font-size: 3rem; margin-bottom: 20px; }
                h1 { font-size: 1.5rem; color: #ff7b72; margin-bottom: 15px; }
                p { font-size: 0.95rem; color: #8b949e; margin-bottom: 25px; }
                .badge {
                    display: inline-block;
                    background: rgba(240, 246, 252, 0.05);
                    border: 1px solid rgba(240, 246, 252, 0.1);
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    color: #6e7681;
                    font-family: monospace;
                }
            `;
            document.head.appendChild(style);

            setTimeout(() => window.stop(), 50);
        };

        if (document.body) {
            renderBlockPage();
        } else {
            document.addEventListener("DOMContentLoaded", renderBlockPage, { once: true });
        }
    }
})();