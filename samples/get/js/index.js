
// const issuePostRequest = () => {
//     fetch(url, {
//         method: 'POST',
//         headers: {
//             'Accept': 'application/json',
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             name: "sarah",
//             vote: "1"
//         })
//     })
//     .then(response => response.json())
//     .then(data => {
//         console.log(data);
//         issueGetRequest();
//     });
// };

const container = document.querySelector('#output');
const issueGetRequest = () => {
    const url = document.querySelector('#endpoint').value;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            container.innerHTML = JSON.stringify(data, null, 4);
        });
};


document.querySelector('button').onclick = issueGetRequest;