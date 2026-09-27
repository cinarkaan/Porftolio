(function () {
    const bypassForMe = false; // Test için true yapabilirsiniz.

    // =========================================================
    // DEVELOPER BYPASS
    // =========================================================

    if (bypassForMe) {
        console.log("Developer Mode Is Enabled: Regional Blocking bypassed.");
        return;
    }

    // =========================================================
    // ENGELLENECEK TIMEZONE'LAR
    // =========================================================

    const blockedTimeZones = [
        // Turkey
        "Europe/Istanbul",
        "Asia/Istanbul",

        // China
        "Asia/Shanghai",
        "Asia/Chongqing",
        "Asia/Harbin",
        "Asia/Urumqi",

        // Russia
        "Europe/Moscow",
        "Asia/Anadyr",
        "Asia/Kamchatka",
        "Asia/Magadan",
        "Asia/Sakhalin",
        "Asia/Vladivostok",
        "Asia/Yakutsk",
        "Asia/Irkutsk",
        "Asia/Krasnoyarsk",
        "Asia/Novosibirsk",
        "Asia/Omsk",
        "Asia/Yekaterinburg",
        "Europe/Samara",
        "Europe/Saratov",
        "Europe/Ulyanovsk",
        "Europe/Astrakhan",
        "Europe/Volgograd",
        "Europe/Kirov",
        "Europe/Kaliningrad",

        // North Korea
        "Asia/Pyongyang",

        // Iran
        "Asia/Tehran"
    ];

    // =========================================================
    // ENGELLENECEK ÜLKELER
    // =========================================================

    const blockedCountryCodes = [
        "TR",
        "CN",
        "RU",
        "KP",
        "IR"
    ];

    // =========================================================
    // BAŞLANGIÇTA SAYFAYI GİZLE
    // =========================================================

    document.documentElement.style.visibility = "hidden";

    // =========================================================
    // 1. TIMEZONE CHECK
    // =========================================================

    const userTimeZone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "";

    const isBlockedTimeZone =
        blockedTimeZones.includes(userTimeZone);

    if (isBlockedTimeZone) {
        blockAccess("REGIONAL_TIMEZONE");
        return;
    }

    // =========================================================
    // 2. IP / COUNTRY / VPN CHECK
    // =========================================================

    checkRegion();

    async function checkRegion() {
        const controller = new AbortController();

        const timeout = setTimeout(function () {
            controller.abort();
        }, 5000);

        try {

            // =================================================
            // 2A. GET PUBLIC IP
            // =================================================

            const ipResponse = await fetch(
                "https://api.ipquery.io/",
                {
                    method: "GET",
                    cache: "no-store",
                    signal: controller.signal
                }
            );

            if (!ipResponse.ok) {
                throw new Error(
                    "IP API HTTP " + ipResponse.status
                );
            }

            const ipAddress =
                (await ipResponse.text()).trim();

            if (!ipAddress) {
                throw new Error("Public IP could not be detected.");
            }

            // =================================================
            // 2B. GET FULL IP INTELLIGENCE
            // =================================================

            const regionResponse = await fetch(
                "https://api.ipquery.io/" +
                encodeURIComponent(ipAddress),
                {
                    method: "GET",
                    cache: "no-store",
                    signal: controller.signal
                }
            );

            if (!regionResponse.ok) {
                throw new Error(
                    "Region API HTTP " +
                    regionResponse.status
                );
            }

            const data = await regionResponse.json();

            // =================================================
            // API RESPONSE VALIDATION
            // =================================================

            if (
                !data ||
                !data.location ||
                !data.risk
            ) {
                throw new Error(
                    "Invalid region API response."
                );
            }

            // =================================================
            // COUNTRY
            // =================================================

            const countryCode =
                typeof data.location.country_code === "string"
                    ? data.location.country_code.toUpperCase()
                    : "";

            const isBlockedCountry =
                blockedCountryCodes.includes(countryCode);

            // =================================================
            // VPN / PROXY / TOR
            // =================================================

            const isVPN =
                data.risk.is_vpn === true;

            const isProxy =
                data.risk.is_proxy === true;

            const isTor =
                data.risk.is_tor === true;

            const isSecurityRisk =
                isVPN ||
                isProxy ||
                isTor;

            // =================================================
            // 3. COUNTRY CHECK
            // =================================================

            if (isBlockedCountry) {
                blockAccess("REGIONAL_LOCATION");
                return;
            }

            // =================================================
            // 4. VPN / PROXY / TOR CHECK
            // =================================================

            if (isSecurityRisk) {
                blockAccess("VPN_PROXY_DETECTED");
                return;
            }

            // =================================================
            // ACCESS ALLOWED
            // =================================================

            clearTimeout(timeout);

            document.documentElement.style.visibility =
                "visible";

            console.log(
                "Regional verification passed:",
                {
                    country: countryCode,
                    timezone: userTimeZone,
                    vpn: isVPN,
                    proxy: isProxy,
                    tor: isTor
                }
            );

        } catch (error) {

            clearTimeout(timeout);

            // =================================================
            // API HATASI - FAIL OPEN
            // =================================================

            console.warn(
                "Regional verification unavailable:",
                error
            );

            document.documentElement.style.visibility =
                "visible";
        }
    }

    // =========================================================
    // BLOCK PAGE
    // =========================================================

    function blockAccess(reason) {

        const renderBlockPage = () => {

            document.documentElement.style.visibility =
                "visible";

            document.body.innerHTML = `
                <div class="error-card">
                    <div class="icon">📍</div>

                    <h1>403 | REGIONAL ERROR</h1>

                    <p>
                        Sorry, this website is currently under
                        regional restrictions and is not accessible
                        from your location.
                    </p>

                    <div class="badge">
                        ERROR_CODE: BLOCKED_${reason}
                    </div>
                </div>
            `;

            const style =
                document.createElement("style");

            style.textContent = `
                * {
                    box-sizing: border-box;
                }

                body {
                    background-color: #0b0f17 !important;
                    color: #f0f6fc !important;

                    font-family:
                        -apple-system,
                        BlinkMacSystemFont,
                        "Segoe UI",
                        Roboto,
                        sans-serif !important;

                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;

                    height: 100vh !important;

                    margin: 0 !important;
                    padding: 20px !important;

                    overflow: hidden !important;
                }

                .error-card {
                    background: #161b22;

                    border: 1px solid #30363d;
                    border-radius: 12px;

                    padding: 40px 30px;

                    max-width: 450px;
                    width: 100%;

                    text-align: center;

                    box-shadow:
                        0 10px 30px
                        rgba(0, 0, 0, 0.5);

                    animation:
                        fadeIn 0.4s ease-out;
                }

                .icon {
                    font-size: 3rem;

                    margin-bottom: 20px;

                    display: inline-block;

                    animation:
                        pulse 2s infinite;
                }

                h1 {
                    font-size: 1.5rem;

                    margin:
                        0 0 15px 0;

                    color: #ff7b72;

                    font-weight: 600;
                }

                p {
                    font-size: 0.95rem;

                    color: #8b949e;

                    line-height: 1.6;

                    margin:
                        0 0 25px 0;
                }

                .badge {
                    display: inline-block;

                    background:
                        rgba(
                            240,
                            246,
                            252,
                            0.05
                        );

                    border:
                        1px solid
                        rgba(
                            240,
                            246,
                            252,
                            0.1
                        );

                    padding:
                        6px 12px;

                    border-radius: 20px;

                    font-size: 0.75rem;

                    color: #6e7681;

                    font-family: monospace;

                    letter-spacing: 0.5px;
                }

                @keyframes fadeIn {

                    from {
                        opacity: 0;
                        transform:
                            translateY(10px);
                    }

                    to {
                        opacity: 1;
                        transform:
                            translateY(0);
                    }
                }

                @keyframes pulse {

                    0% {
                        transform:
                            scale(1);
                    }

                    50% {
                        transform:
                            scale(1.05);
                    }

                    100% {
                        transform:
                            scale(1);
                    }
                }
            `;

            document.head.appendChild(style);

            setTimeout(function () {
                window.stop();
            }, 50);
        };

        if (document.body) {

            renderBlockPage();

        } else {

            document.addEventListener(
                "DOMContentLoaded",
                renderBlockPage,
                { once: true }
            );
        }
    }

})();