document.getElementById("shorten-form").addEventListener("submit", function (event) {
  event.preventDefault();

  const url = document.getElementById("url-input").value;

  fetch("/shorten", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url })
  })
  .then(response => response.json())
  .then(data => {
    if (data.shortUrl) {
      const resultDiv = document.getElementById("result");
      
      const shortenedUrl = `${window.location.origin}/${data.shortUrl}`;
      
      const generatedUrls = JSON.parse(localStorage.getItem("generatedUrls")) || [];
      generatedUrls.push({ originalUrl: data.originalUrl, shortUrl: data.shortUrl });
      localStorage.setItem("generatedUrls", JSON.stringify(generatedUrls));
      
      // Create a copy button and add it to the resultDiv
      resultDiv.innerHTML = `
        Shortened: <a href="${shortenedUrl}" target="_blank" class="url-shortened">${shortenedUrl}</a>
        <button onclick="copyToClipboard('${shortenedUrl}')">Copy</button>
      `;
      
      // Reset the input field
      document.getElementById("url-input").value = '';
      
      displayGeneratedUrls();
    } else {
      alert(`${data.error}`);
    }
  });
});

function displayGeneratedUrls() {
  const generatedUrls = JSON.parse(localStorage.getItem("generatedUrls")) || [];
  const historyDiv = document.getElementById("history");

  historyDiv.innerHTML = generatedUrls.map(urlObj => {
    const shortUrl = `${window.location.origin}/${urlObj.shortUrl}`;
    return `
      <p>
        <a href="${urlObj.originalUrl}" target="_blank" class="url-shortened">${urlObj.originalUrl}</a><br>
        - Shortened: <a href="${shortUrl}" target="_blank" class="url-shortened">${shortUrl}</a>
      </p>
    `;
  }).join("");
}

// Function to copy URL to clipboard
function copyToClipboard(url) {
  navigator.clipboard.writeText(url).then(() => {
    alert('URL copied to clipboard!');
  }).catch(err => {
    console.error('Error copying to clipboard: ', err);
  });
}

// Initial display of URLs
displayGeneratedUrls();
