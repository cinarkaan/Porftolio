(function() {
    const bypassForMe = false; // Constant can be setted as true , while testing 

    if (bypassForMe) {
        console.log("Developer Mode Is Enabled: The Blocking has been passed !!!.");
        return;
    }

    // Blocked Time Zones 
    const blockedTimeZones = [
        'Europe/Istanbul', 'Asia/Istanbul',
        'Asia/Shanghai', 'Asia/Chongqing', 'Asia/Harbin', 'Asia/Urumqi',
        'Europe/Moscow', 'Asia/Anadyr', 'Asia/Kamchatka', 'Asia/Magadan', 'Asia/Sakhalin', 'Asia/Vladivostok', 'Asia/Yakutsk', 'Asia/Irkutsk', 'Asia/Krasnoyarsk', 'Asia/Novosibirsk', 'Asia/Omsk', 'Asia/Yekaterinburg', 'Europe/Samara', 'Europe/Saratov', 'Europe/Ulyanovsk', 'Europe/Astrakhan', 'Europe/Volgograd', 'Europe/Kirov', 'Europe/Kaliningrad',
        'Asia/Pyongyang',
        'Asia/Tehran'
    ];

    // Blocked Countries & Codes , Names
    const blockedCountryCodes = ['TR', 'CN', 'RU', 'KP', 'IR'];
    const blockedCountryNames = ['turkey', 'china', 'russia', 'russian federation', 'north korea', 'korea, democratic people', 'iran'];

    // 1. Step: TIMEZONE CHECK
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (blockedTimeZones.includes(userTimeZone)) {
        blockAccess("REGIONAL");
        return;
    }

    // 2. Step: Location Check
    fetch('https://ip-api.com/json/')
        .then(response => response.json())
        .then(data => {
            const countryCode = data.countryCode ? data.countryCode.toUpperCase() : '';
            const countryName = data.country ? data.country.toLowerCase() : '';

            const isBlockedCode = blockedCountryCodes.includes(countryCode);
            const isBlockedName = blockedCountryNames.some(name => countryName.includes(name));

            if (isBlockedCode || isBlockedName) {
                blockAccess("REGIONAL_LOCATION");
            }
        })
        .catch(err => {
            blockAccess("SECURITY_CHECK_FAILED");
        });
    
    // The function that destroy the page and shows the information
    function blockAccess(reason) {
        // To clear current website content while calling the function
         const renderBlockPage = () => {
            // Reset all body content and then show new HTML content
            document.body.innerHTML = `
                <div class="error-card">
                    <div class="icon">📍</div>
                    <h1>403 | REGIONAL ERROR</h1>
                    <p>
                        Sorry, this website is currently under regional restrictions and is not accessible from your location.
                    </p>
                    <div class="badge">ERROR_CODE: BLOCKED_${reason}</div>
                </div>
            `;

            // Injecting CSS Styles inside of the HTML
            const style = document.createElement('style');
            style.innerHTML = `
                * { box-sizing: border-box; }
                body { 
                    background-color: #0b0f17 !important; 
                    color: #f0f6fc !important; 
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; 
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
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                    animation: fadeIn 0.4s ease-out;
                }
                .icon { font-size: 3rem; margin-bottom: 20px; display: inline-block; animation: pulse 2s infinite; }
                h1 { font-size: 1.5rem; margin: 0 0 15px 0; color: #ff7b72; font-weight: 600; }
                p { font-size: 0.95rem; color: #8b949e; line-height: 1.6; margin: 0 0 25px 0; }
                .badge {
                    display: inline-block;
                    background: rgba(240, 246, 252, 0.05);
                    border: 1px solid rgba(240, 246, 252, 0.1);
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    color: #6e7681;
                    font-family: monospace;
                    letter-spacing: 0.5px;
                }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
            `;
            document.head.appendChild(style);
            
            // Kodun devam etmesini tamamen durdurmak için tarayıcı yüklemesini şimdi kesiyoruz
            setTimeout(() => { window.stop(); }, 50); 
        };

        // Eğer DOM hazırsa hemen çalıştır, değilse yüklenmesini bekle
        if (document.body) {
            renderBlockPage();
        } else {
            document.addEventListener("DOMContentLoaded", renderBlockPage);
        }

        // JS yürütmesini durdurmak için hata fırlat
        throw new Error("Execution stopped due to restriction: " + reason);
    }
})();