let endpoints;

const makeSelectMenu = () => {
    const options = endpoints.map(item => {
        return `
        <option value="${item.url}">${item.name}</option>`;
    });
    html = `
        <select id="endpoint">
            ${options}
            <option value="new">-- Add New --</option>
        </select>`
    document.querySelector('#container').innerHTML = html;
    document.querySelector('#endpoint').onchange = toggle;
};

const getWidgetTemplate = () => {
    fetch('/endpoints/')
        .then(response => response.json())
        .then(data => {
            endpoints = data;
        })
        .then(makeSelectMenu);
};

const toggle = () => {
    console.log('toggle')
    if (document.querySelector('#endpoint').value === 'new') {
        document.querySelector('#container').innerHTML = `
            <input type="text" id="endpoint" value=""><br>
            <a id="back" href="#">back</a>
        `;
        document.querySelector('#back').onclick = makeSelectMenu;
    };
};

getWidgetTemplate();