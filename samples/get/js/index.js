const url = '/votes';
const container = document.querySelector('#output');

const issuePostRequest = () => {
    fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: "sarah",
            vote: "1"
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        issueGetRequest();
    });
};
const issueGetRequest = () => {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            for (item of data) {
                container.innerHTML += getTemplate(item);
            }
        });
};

const getTemplate = (item) => {
    return `<pre>${JSON.stringify(item, null, 4)}</pre>`;
};

issuePostRequest();