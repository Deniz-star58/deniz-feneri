const apiBaseUrl = "https://api.open-meteo.com/v1/forecast?current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max&timezone=auto";

const cities = {
    istanbul: { lat: 41.0082, lon: 28.9784, currentData: null },
    sivas: { lat: 39.7477, lon: 37.0179, currentData: null }
};

let searchedCityData = null;
let timeIntervals = {};
let isNotificationsEnabled = false;

document.addEventListener("DOMContentLoaded", () => {
    getWeatherData(cities.istanbul.lat, cities.istanbul.lon, "istanbul");
    getWeatherData(cities.sivas.lat, cities.sivas.lon, "sivas");

    // Sonucu Kapat Butonu
    const closeBtn = document.getElementById("closeSearchBtn");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            document.getElementById("searchResultRow").classList.add("d-none");
            document.getElementById("forecastRow").classList.add("d-none");
            document.getElementById("searchInput").value = "";
            document.body.className = "";
            isGeoOpen = false; // YENİ: Konum butonunun durumunu sıfırla ki bir sonraki tıkta tekrar açabilsin 
        });
    }

    // GPS ile Konum Bulma Butonu
  // Konum butonunun durumunu takip eden değişken (Açık mı kapalı mı?)
    let isGeoOpen = false;

    // GPS ile Konum Bulma Butonu (Aç/Kapa Özellikli)
    document.getElementById("geoBtn").addEventListener("click", () => {
        const resultRow = document.getElementById("searchResultRow");
        
        if (!isGeoOpen) {
            // Eğer kapalıysa, konumu al ve aç
            getUserLocation();
            isGeoOpen = true;
        } else {
            // Eğer zaten açıksa, aynı butona basıldığında HER ŞEYİ KAPAT ve SIFIRLA
            resultRow.classList.add("d-none");
            document.getElementById("forecastRow").classList.add("d-none");
            document.getElementById("searchInput").value = "";
            document.body.className = ""; 
            isGeoOpen = false; // Durumu tekrar kapalıya çek
        }
    });

    document.getElementById("istanbulCard").addEventListener("click", () => show5DayForecast(cities.istanbul.currentData, "İstanbul"));
    document.getElementById("sivasCard").addEventListener("click", () => show5DayForecast(cities.sivas.currentData, "Sivas"));
    document.getElementById("resCard").addEventListener("click", () => {
        if(searchedCityData) show5DayForecast(searchedCityData, document.getElementById("resCity").innerText);
    });

    document.getElementById("searchBtn").addEventListener("click", handleSearch);
    document.getElementById("searchInput").addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleSearch();
    });
});

// GPS Konumunu Alan ve İlçe/Bölge İsmini Bulan Gelişmiş Fonksiyon
function getUserLocation() {
    if (!navigator.geolocation) {
        alert("Tarayıcınız konum özelliğini desteklemiyor.");
        return;
    }

    document.getElementById("geoBtn").innerHTML = "<i class='fa-solid fa-spinner fa-spin text-light'></i>";

    navigator.geolocation.getCurrentPosition(
        position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            document.getElementById("geoBtn").innerHTML = "<i class='fa-solid fa-location-crosshairs fs-5'></i>";
            
            // Koordinatları hava durumu servisine gönderiyoruz
            const url = `${apiBaseUrl}&latitude=${lat}&longitude=${lon}`;

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    searchedCityData = data;
                    const current = data.current;
                    
                    // Gelen verideki bölge/timezone bilgisini temizleyip ilçe/şehir ismi üretiyoruz
                    // Örn: "Europe/Istanbul" gelirse içinden "Istanbul" kısmını alıyoruz
                    let locationName = "Mevcut Konumunuz";
                    if (data.timezone) {
                        const parts = data.timezone.split('/');
                        locationName = parts[parts.length - 1].replace('_', ' ');
                    }

                    // Arama sonucu satırını aç ve ismi bas
                    const resultRow = document.getElementById("searchResultRow");
                    resultRow.classList.remove("d-none");
                    
                    // Ekrana şehri/bölgeyi yazdırıyoruz
                    document.getElementById("resCity").innerText = `Konum: ${locationName}`;
                    
                    // Hava durumu kartının içini doldur
                    document.getElementById("resTemp").innerText = `${Math.round(current.temperature_2m)}°C`;
                    document.getElementById("resHumidity").innerText = `%${current.relative_humidity_2m}`;
                    document.getElementById("resWind").innerText = `${current.wind_speed_10m} km/s`;

                    startLiveClock(data.timezone, "resTime");

                    const weatherDetails = getWeatherDetails(current.weather_code);
                    document.getElementById("resDesc").innerText = weatherDetails.desc;
                    document.getElementById("resAdvice").innerHTML = `<i class="fa-solid fa-lightbulb me-2"></i>${weatherDetails.advice}`;

                    const iconElement = document.getElementById("resIcon");
                    iconElement.className = `fa-solid ${weatherDetails.icon} fa-3x ${weatherDetails.colorClass}`;

                    changeBackgroundByStatus(weatherDetails.status);
                })
                .catch(error => {
                    console.error("Hata:", error);
                    alert("Hava durumu verisi alınamadı.");
                });
        }, 
        error => {
            document.getElementById("geoBtn").innerHTML = "<i class='fa-solid fa-location-crosshairs fs-5'></i>";
            if (error.code === error.PERMISSION_DENIED) {
                alert(
                    "⚠️ Konum İzni Engellenmiş!\n\n" +
                    "Konumunuzu otomatik bulabilmemiz için tarayıcının sol üst köşesinde bulunan 'Kilit' (🔒) simgesine tıklayıp Konum iznini 'Açık' hale getirmelisiniz."
                );
            } else {
                alert("Konumunuz alınırken bir hata oluştu.");
            }
        }
    );
}

function getWeatherData(lat, lon, elementPrefix) {
    const url = `${apiBaseUrl}&latitude=${lat}&longitude=${lon}`;

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error("Veri çekilemedi");
            return response.json();
        })
        .then(data => {
            if (elementPrefix === "istanbul") cities.istanbul.currentData = data;
            else if (elementPrefix === "sivas") cities.sivas.currentData = data;
            else if (elementPrefix === "res") searchedCityData = data;

            const current = data.current;
            
            document.getElementById(`${elementPrefix}Temp`).innerText = `${Math.round(current.temperature_2m)}°C`;
            document.getElementById(`${elementPrefix}Humidity`).innerText = `%${current.relative_humidity_2m}`;
            document.getElementById(`${elementPrefix}Wind`).innerText = `${current.wind_speed_10m} km/s`;

            const timezone = data.timezone;
            startLiveClock(timezone, `${elementPrefix}Time`);

            const code = current.weather_code;
            const weatherDetails = getWeatherDetails(code);

            document.getElementById(`${elementPrefix}Desc`).innerText = weatherDetails.desc;

            // Tavsiye Metnini Ekrana Basıyoruz
            document.getElementById(`${elementPrefix}Advice`).innerHTML = `<i class="fa-solid fa-lightbulb me-2"></i>${weatherDetails.advice}`;

            const iconElement = document.getElementById(`${elementPrefix}Icon`);
            iconElement.className = `fa-solid ${weatherDetails.icon} fa-3x ${weatherDetails.colorClass}`;

            if (elementPrefix === "res") {
                changeBackgroundByStatus(weatherDetails.status);
            }
        })
        .catch(error => console.error("Hata:", error));
}

// Hava Durumuna Göre Markalı Akıllı Tavsiyeler Üreten Yer
function getWeatherDetails(code) {
    let desc = "Açık"; let status = "clear"; let icon = "fa-sun"; let colorClass = "text-warning";
    let advice = "Hava harika Deniz! Dışarı çıkıp yürüyüş yapmak için harika bir gün.";

    if (code === 0) { 
        desc = "Açık Gökyüzü"; status = "clear"; icon = "fa-sun"; colorClass = "text-warning";
        advice = "Hava pırıl pırıl! Güneş gözlüğünü almayı unutma. 😎";
    }
    else if ([1, 2, 3].includes(code)) { 
        desc = "Parçalı Bulutlu"; status = "cloud"; icon = "fa-cloud"; colorClass = "text-light";
        advice = "Hava biraz bulutlu ama can sıkıcı değil, tam gezmelik bir hava! ☁️";
    }
    else if ([45, 48].includes(code)) { 
        desc = "Sisli"; status = "cloud"; icon = "fa-smog"; colorClass = "text-secondary";
        advice = "Görüş mesafesi düşük, yola çıkacaksan dikkatli olmalısın! 🌫️";
    }
    else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) { 
        desc = "Yağmurlu"; status = "rain"; icon = "fa-cloud-showers-heavy"; colorClass = "text-info";
        advice = "Dışarıda yağmur var, şemsiyeni yanına almayı sakın unutma! ☔";
    }
    else if ([71, 73, 75, 77, 85, 86].includes(code)) { 
        desc = "Karlı"; status = "snow"; icon = "fa-snowflake"; colorClass = "text-primary";
        advice = "Dışarısı buz tutuyor! Sıkı giyin, atkı ve bereni yanına al. ❄️";
    }
    else if ([95, 96, 99].includes(code)) { 
        desc = "Gök Gürültülü"; status = "rain"; icon = "fa-cloud-bolt"; colorClass = "text-danger";
        advice = "Şimşekler çakıyor! Mümkünse kapalı alanlarda kalmaya çalış. ⚡";
    }

    return { desc, status, icon, colorClass, advice };
}

function show5DayForecast(data, cityName) {
    if (!data || !data.daily) return;
    const forecastRow = document.getElementById("forecastRow");
    const container = document.getElementById("forecastContainer");
    document.getElementById("forecastCityName").innerText = cityName;
    container.innerHTML = ""; forecastRow.classList.remove("d-none");

    for (let i = 1; i <= 5; i++) {
        const dateStr = data.daily.time[i];
        const maxTemp = Math.round(data.daily.temperature_2m_max[i]);
        const code = data.daily.weather_code[i];
        
        const weatherDetails = getWeatherDetails(code); 
        const dateObj = new Date(dateStr);
        
        const dayName = dateObj.toLocaleDateString("tr-TR", { weekday: "short" });

        // Dereceye ve hava durumuna göre akıllı Emoji Seçici Çark 🧭
        let weatherEmoji = "☀️"; // Varsayılan güneşli
        const descText = (weatherDetails.desc || "").toLowerCase();

        if (descText.includes("yağmur") || descText.includes("sağanak")) {
            weatherEmoji = "🌧️";
        } else if (descText.includes("kar") || descText.includes("fırtına")) {
            weatherEmoji = "❄️";
        } else if (descText.includes("bulutlu") || descText.includes("kapalı")) {
            weatherEmoji = "☁️";
        } else if (maxTemp >= 28) {
            weatherEmoji = "🔥"; // 28 derece üstü sıcaklık alarmı
        } else if (maxTemp <= 15) {
            weatherEmoji = "🍃"; // Serin hava
        } else if (descText.includes("açık") || descText.includes("güneşli")) {
            weatherEmoji = "☀️";
        }

        // HTML yapısını o inatçı FontAwesome yerine doğrudan renkli emojilerle donattık! 🚢
        const miniCardHTML = `
            <div class="col-6 col-md-2">
                <div class="forecast-mini-card">
                    <h6 class="fw-bold mb-2">${dayName}</h6>
                    <div class="fs-1 my-2" style="line-height: 1;">${weatherEmoji}</div>
                    <h5 class="fw-bold mb-1">${maxTemp}°C</h5>
                    <small class="text-capitalize" style="font-size: 11px;">${weatherDetails.desc}</small>
                </div>
            </div>`;
        container.innerHTML += miniCardHTML;
    }
    forecastRow.scrollIntoView({ behavior: 'smooth' });
}

function startLiveClock(timezone, elementId) {
    if (timeIntervals[elementId]) clearInterval(timeIntervals[elementId]);
    function updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString("tr-TR", { timeZone: timezone });
        const timeElement = document.getElementById(elementId);
        if (timeElement) timeElement.innerText = timeString;
    }
    updateClock();
    timeIntervals[elementId] = setInterval(updateClock, 1000);
}

function handleSearch() {
    const query = document.getElementById("searchInput").value.trim();
    if (query === "") { alert("Lütfen bir şehir adı yazın!"); return; }
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=1&language=tr`;
    fetch(geoUrl).then(res => res.json()).then(geoData => {
        if (!geoData.results || geoData.results.length === 0) { alert("Şehir bulunamadı!"); return; }
        const result = geoData.results[0];
        const resultRow = document.getElementById("searchResultRow");
        resultRow.classList.remove("d-none");
        document.getElementById("resCity").innerText = result.name;
        getWeatherData(result.latitude, result.longitude, "res");
    }).catch(err => alert("Bir hata oluştu."));
}

function changeBackgroundByStatus(status) {
    const body = document.body; body.className = ""; 
    if (status === "clear") body.classList.add("clear-sky");
    else if (status === "cloud") body.classList.add("cloudy");
    else if (status === "rain") body.classList.add("rainy");
    else if (status === "snow") body.classList.add("snowy");
}

// ================= BİLDİRİM SİSTEMİ =================
if ('serviceWorker' in navigator && 'PushManager' in window) {
    navigator.serviceWorker.register('sw.js').then(reg => { checkInitialPermission(); }).catch(err => console.error(err));
}
function checkInitialPermission() {
    const notifySwitch = document.getElementById("notifySwitch");
    if (Notification.permission === 'granted') {
        const userPreference = localStorage.getItem("weatherNotifications");
        if (userPreference === "allowed" || userPreference === null) setSwitchState(true);
        else setSwitchState(false);
    } else setSwitchState(false);
}
document.getElementById("notifySwitch").addEventListener("change", (e) => {
    if (e.target.checked) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                setSwitchState(true); localStorage.setItem("weatherNotifications", "allowed");
                // Test bildirimini Deniz Feneri konseptine geçirdik 🚢
                sendLocalNotification("Deniz Feneri Raporu", "Fener sinyalleri başarıyla aktif edildi! 🧭⚓");
            } else { alert("İzin reddedildi."); setSwitchState(false); }
        });
    } else { setSwitchState(false); localStorage.setItem("weatherNotifications", "blocked"); }
});

function setSwitchState(active) {
    const notifySwitch = document.getElementById("notifySwitch");
    const switchLabel = document.getElementById("switchLabel");
    const statusText = document.getElementById("notifyStatus");
    isNotificationsEnabled = active; notifySwitch.checked = active;
    if (active) {
        // "Açık" yerine denizci markamıza özel yazılar bastık!
        switchLabel.innerText = "Fener Bildirimleri: Sinyal Açık"; switchLabel.className = "form-check-label text-success fw-bold";
        statusText.innerText = "Fener uyanık! Her sabah deniz seyir raporu cihazınıza fırlatılacak."; statusText.className = "small text-success mt-2 text-center";
    } else {
        // "Kapalı" yerine denizci markamıza özel yazılar bastık!
        switchLabel.innerText = "Fener Bildirimleri: Sinyali Kes"; switchLabel.className = "form-check-label text-danger fw-bold";
        statusText.innerText = "Fener söndürüldü, sabah raporları durduruldu."; statusText.className = "small text-light-50 mt-2 text-center";
    }
}
function sendLocalNotification(title, body) {
    if (Notification.permission === 'granted' && isNotificationsEnabled) {
        navigator.serviceWorker.ready.then(reg => { reg.showNotification(title, { body: body, icon: 'https://cdn-icons-png.flaticon.com/512/869/869869.png' }); });
    }
}