// <<---------------> set server connection <--------------->>

const apiHost = 'localhost';
const apiPort = '3002';
const apiUrl = `http://${apiHost}:${apiPort}/`;

// <<-------------><---------------------------------------->>

// <<---------------> constants <--------------->>

const salute = document.querySelector('#salute');
const currentTime = new Date().getHours();
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// <<-------------><---------------------------->>

// <<-------------> say hi to user <--------------->>

salute.innerHTML = currentTime < 12 && currentTime > 6 ? "Good morning," : currentTime < 20 && currentTime > 12 ? "Good afternoon," : "Good evening,";

var url_string = (window.location.href).toLowerCase();
var url = new URL(url_string);
var name = url.searchParams.get("name");

if (name == 'filipe') {
    loggedInUser.value = 0;
} else if (name == 'guilherme') {
    loggedInUser.value = 1;
}

// <<-------------><-------------------------------->>

// <<-------------> on init <--------------->>

refreshPage();

// <<-------------><------------------------>>


// <<-------------> declarations <--------------->>

const container = document.querySelector('#outer-container');
let yearlyExpenses = document.querySelector('.no-data')

// <<--> canvas <-->>
const yearlyExpensesList = document.querySelector('#yearly-expenses');
const ctxY = document.getElementById('yearly-canvas');
const ctxM = document.getElementById('monthly-canvas');
const montlyCanvas = document.getElementById('monthly-overview-canvas');
const ctxYA = document.getElementById('yearly-average-canvas');


// <<--> forms <-->>
let createCategoryDiv = document.querySelector('#create-category-div');
let createMovementDiv = document.querySelector('#create-movement-div');


// <<--> buttons <-->>
let resetCategoryButton = document.querySelector('#reset-category-button');
let createCategoryButton = document.querySelector('#create-category-button');
let createMovementButton = document.querySelector('#create-movement-button');
let resetMovementButton = document.querySelector('#reset-movement-button');

// <<--> charts <-->>
var dmc;
var da;
var dyc;
var lo;

let usersSelectForm = document.querySelector('#user-select');

const filtersMonth = document.querySelector('#filtersList');

let skippedRecords = 0;
const limit = 100000;

let monthsArr = [];
let monthlySpendingsList = [];

// <<-------------><----------------------------->>

// <<-------------> event listeners <--------------->>

createMovementButton.addEventListener('click', async (e) => {
    e.preventDefault();

    let formData = new FormData(createMovementDiv);

    await createMovement(formData);
})

createCategoryButton.addEventListener('click', (e) => {
    e.preventDefault();

    let formData = new FormData(createCategoryDiv);

    createCategory(formData);
})

// <<-------------><-------------------------------->>

// <<-------------> api calls <--------------->>

function welcomeNewUsers() {

}

function getAllYearlyMovementsByCategory() {
    axios.get(`http://${apiHost}:${apiPort}/getAllYearlyMovementsByCategory/${new Date().getFullYear()}`).then(response => {
        let total = [];
        let categories = [];

        if (response.data.length > 0) {
            response.data.forEach(element => {
                categories.push(element.name)
                total.push(element.total)
            });

            const dataYMC = {
                datasets: [{
                    data: total
                }],


                // These labels appear in the legend and in the tooltips when hovering different arcs
                labels: categories
            };

            if (dyc == null) {
                dyc = new Chart(ctxY, {
                    type: 'doughnut',
                    data: dataYMC,
                    options: {
                        backgroundColor: [
                            '#0B2447',
                            '#19376D', '#576CBC', '#A5D7E8'

                        ],
                        borderColor: "rgba(255,255,255,0)"

                    }
                });
            }else{
                addData(dyc, dataYMC.labels, dataYMC.datasets);
                // dyc.data.datasets.push(dataYMC.datasets);
            }
        } else {
            document.querySelector('#yearly-total').innerHTML = `
                <div id="no-data" class="card shadow-lg p-3 bg-white rounded">
                        <h2>no data</h2>
                    </div>
                `
        }
    });
}

function getAllMonthlyMovementsByCategory() {
    axios.get(`http://${apiHost}:${apiPort}/getAllMonthlyMovementsByCategory/${new Date().getMonth() + 1}`).then(response => {
        if (response.data.length > 0) {
            let results = response.data;

            const dataM = {
                datasets: [{
                    data: results.map(el => el.total)
                }],

                // These labels appear in the legend and in the tooltips when hovering different arcs
                labels: results.map(el => el.name)
            };

            console.log(dmc)

            if (dmc == null) {
                dmc = new Chart(ctxM, {
                    type: 'doughnut',
                    data: dataM,
                    options: {
                        backgroundColor: [
                            '#0B2447',
                            '#19376D', '#576CBC', '#A5D7E8'

                        ],
                        borderColor: "rgba(255,255,255,0)"

                    }
                });
            } else {
                console.log(dataM)
                addData(dmc, dataM.labels, dataM.datasets);

                // dmc.data.labels.push(dataM.labels);
                // dmc.data.datasets.push(dataM.datasets);
            }
        } else {
            document.querySelector('#monthly-category-div').innerHTML = `
                    <div id="no-data" class="card shadow-lg p-3 bg-white rounded">
                        <h2>no data</h2>
                    </div>
                `;
        }
    });
}

function getAllMonthlyMovementsByUser() {
    axios.get(`http://${apiHost}:${apiPort}/getAllMonthlyMovementsByUser/${new Date().getFullYear()}`).then(response => {
        let colours = [{
            borderColor: 'rgb(25, 192, 255)',
            backgroundColor: 'rgb(25, 192, 255)'
        }, {
            borderColor: 'rgb(100, 50, 44)',
            backgroundColor: 'rgb(100, 50, 44)'
        }]
        let results = response.data;

        if (response.data.length > 0) {
            let users = results.map(el => el.name).filter(distinct);

            let datasets = [];

            users.forEach((user, index) => {
                let userSpendings = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

                results.filter(el => el.name == user).forEach(element => {
                    userSpendings[element.month - 1] = element.total;
                });

                datasets.push(
                    {
                        label: user,
                        data: userSpendings,
                        borderColor: colours[index][0],
                        backgroundColor: colours[index][1],
                        yAxisID: 'y' + index,
                    }
                );
            });

            const labels = months;
            const dataLine = {
                labels: labels,
                datasets: datasets
            }

            const config = {
                type: 'line',
                data: dataLine,
            };

            if (lo == null) {
                lo = new Chart(montlyCanvas, {
                    type: 'line',
                    data: dataLine,
                    options: {
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    display: false
                                }
                            }
                        }
                    }
                });
            } else {
                addData(lo, dataLine.labels, datasets.datasets);


                // lo.data.labels.push(dataLine.labels);
                // lo.data.datasets.push(dataLine.datasets);
                // lo.update();

                // lo.data.labels.push(dataLine.labels);
                // lo.data.datasets.push(dataLine.datasets);
                // lo.update();
            }

        } else {
            document.querySelector('#monthly-overview').innerHTML = `
                <div id="no-data" class="card shadow-lg p-3 bg-white rounded">
                        <h2>no data</h2>
                    </div>
                `
        }
    });
}

function getAllMonthlyMovementsAverage() {
    axios.get(`http://${apiHost}:${apiPort}/getAllMonthlyMovementsAverage/${new Date().getFullYear()}`).then(response => {
        let results = response.data;

        let average = 0;
        let thisMonth = 0;
        let total = 0;

        results.map(el => {
            if (el.month != new Date().getMonth() + 1)
                total += el.total;
            else
                thisMonth = el.total;
        });

        if (thisMonth != 0) {
            // get average of all months except current one
            average = total / results.length - 1;
        }

        let valuesChart = [];
        valuesChart[0] = average;
        valuesChart[1] = average - thisMonth < 0 ? 0 : average - thisMonth;
        const dataM = {
            datasets: [{
                data: valuesChart
            }],

            // These labels appear in the legend and in the tooltips when hovering different arcs
            labels: [months[new Date().getMonth()], 'Average']
        };

        if (da == null) {
            da = new Chart(ctxYA, {
                type: 'doughnut',
                data: dataM,
                options: {
                    backgroundColor: [
                        '#0B2447',
                        '#19376D', '#576CBC', '#A5D7E8'

                    ],
                    borderColor: "rgba(255,255,255,0)"

                }
            });
        } else {
            addData(da, dataM.labels, dataM.datasets);

            // da.data.labels.push([months[new Date().getMonth()], 'Average']);
            // da.data.datasets.push(dataM.datasets);
        }

        if (total == 0) {
            document.querySelector('#yearly-average').innerHTML = `
                    <div id="no-data" class="card shadow-lg p-3 bg-white rounded">
                        <h2>no data</h2>
                    </div>                
                `
        }
    });
}

function setCurrent() {
    axios.get(`http://${apiHost}:${apiPort}/getAllMonthlyMovementsAverage/${new Date().getFullYear()}`).then(response => {
        let results = response.data;

        let average = 0;
        let thisMonth = 0;
        let total = 0;

        results.map(el => {
            if (el.month != new Date().getMonth() + 1)
                total += el.total;
            else
                thisMonth = el.total;
        });

        if (thisMonth != 0) {
            // get average of all months except current one
            average = total / results.length - 1;
        }

        let currentDiv = document.querySelector('#numbers');
        let arrow = document.querySelector('#arrow');
        let currentMoney = thisMonth;
        let roundedMoney = (Math.round(currentMoney) * 10) / 10
        let currentMoneyArr = Array.from(roundedMoney.toString());
        let statusColour = '';

        average > currentMoney ? statusColour = arrow.classList.add('icon-green') :
            average < currentMoney ? statusColour = arrow.classList.add('icon-red') : statusColour = arrow.classList.add('icon-yellow');

        currentDiv.innerHTML = "";

        currentMoneyArr.forEach(number => {
            currentDiv.innerHTML += `
                <div class="number-card w-100 shadow-lg rounded">
                    ${number}
                </div>
            `;
        });
        currentDiv.innerHTML += `<div class="w-100 shadow-lg rounded number-card"><img style="max-height: 5rem" src="./icons/light/euro-sign.svg" class="icon " alt=""></div>`;

    });
}

// <<-------------><-------------------------->>


// <<-------------> global functions <--------------->>

const distinct = (value, index, self) => {
    return self.indexOf(value) === index;
}

function addData(chart, labels, newData) {
    removeData(chart);

    if(labels)
        chart.data.labels = labels;

    if(newData)
        chart.data.datasets = newData;

    chart.update();
}

function removeData(chart) {
    if(chart.data.labels)
        chart.data.labels.pop();

    if(chart.data.datasets)
        chart.data.datasets.forEach((dataset) => {
            dataset.data.pop();
        });

    chart.update();
}


function refreshPage() {
    getAllMonthlyMovementsAverage();
    getAllMonthlyMovementsByUser();
    getAllMonthlyMovementsByCategory();
    getAllYearlyMovementsByCategory();
    setCurrent();
    getHistory();
    getCategoriesComboBox();
}

function switchFluid(el) {
    let fluid = el.checked ? 'container-fluid' : 'container';
    container.classList.remove('container');
    container.classList.remove('container-fluid');
    container.classList.add(fluid);
}

function switchToMonthList(month) {
    yearlyExpensesList.innerHTML = '';


    monthlySpendingsList.forEach(element => {

        let date = new Date(element.date)

        if (new Date(element.date).getMonth() == month)
            yearlyExpensesList.innerHTML +=
                `<li data-id="${element.id}" class="list-group-item d-flex justify-content-between align-items-start"
                        style="border-top: 0 !important;border-top: 1px solid black;border-left: 0 !important;border-right: 0 !important;">
                        <div class="ms-2 me-auto">
                            <div style="display: flex; justify-content: start; align-items: center; gap: .5rem;"
                                class="fw-bold">
                                <img src="./icons/${element.icon}" class="icon" height="32" width="32" />
                                <span class="desc-history" contenteditable="true">${element.description}</span>
                            </div>
                            <span class="date-history" contenteditable="true">${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}</span>
                        </div>
                        <div class="d-flex g-1" style="justify-content: center; align-items: center; gap: .5rem;">
                            <span class="badge value-history bg-primary rounded-pill" contenteditable="true">${element.value}€</span>
                            <img class="icon-red" onclick="deleteMovement(${element.id})" src="./icons/duotone/window-close.svg" height="16" width="16"/>
                        </div>
                    </li>`;
    });
}

async function getHistory() {
    let limit = 100;
    let skippedRecords = 0;
    await axios.get(`http://${apiHost}:${apiPort}/getHistoryByYear/${new Date().getFullYear()}/${limit}/${skippedRecords}`).then(response => {


        if (response.data.length > 0) {
            skippedRecords += limit;

            monthlySpendingsList = response.data;

            response.data.forEach(element => {
                let date = new Date(element.date);
                if (!monthsArr.includes(months[date.getMonth()]))
                    monthsArr.push(months[date.getMonth()]);
            });

            if (monthsArr.includes(new Date().getMonth())) {
                switchToMonthList(months.indexOf(monthsArr[0]));
            } else {
                switchToMonthList(months.indexOf(monthsArr[0]));
            }


            filtersMonth.innerHTML = '';
            monthsArr.forEach((element, index) => {
                filtersMonth.innerHTML += `
            <div class="card col-2 clickable" onclick="switchToMonthList(${months.indexOf(monthsArr[index])})" style="text-align: center;">${element}</div>
            `
            });
        } else {
            yearlyExpenses.innerHTML = `
                <div id="no-data" class="card shadow-lg p-3 bg-white rounded">
                    <h2>no data</h2>
                </div>
            `;
        }

    })
}

function getCategoriesComboBox() {
    axios.get(`http://${apiHost}:${apiPort}/all/categories`).then(response => {
        let categoriesDropDown = document.querySelector('#category-dropdown');

        categoriesDropDown.innerHTML = '';

        response.data.forEach(category => {
            categoriesDropDown.innerHTML += `
            <option value="${category.id}">${category.name}</option>
            `;
        });
    });
}

function createCategory(formData) {
    axios.post(`http://${apiHost}:${apiPort}/create/category`, {
        name: document.forms["create-category-div"]["name"].value,
        iconpath: document.forms["create-category-div"]["iconpath"].value
    })
        .then(function (response) {
            getCategoriesComboBox()
        })
        .catch(function (error) {
            console.error(error);
        });
}

async function createMovement(formData) {
    await axios.post(`http://${apiHost}:${apiPort}/create/movement`, {
        description: document.forms["create-movement-div"]["desc-input"].value,
        categoryId: document.querySelector('#category-dropdown').value,
        value: document.forms["create-movement-div"]["cost-input"].value,
        date: document.forms["create-movement-div"]["date-input"].value,
        user: document.querySelector('#user-select').value
    })
        .then(async function (response) {

        })
        .catch(function (error) {
            console.error(error);
        });

    switchToMonthList(new Date(document.forms["create-movement-div"]["date-input"].value).getMonth())
    refreshPage();
}

async function updateMovements(e) {
    e.preventDefault();

    let updatables = [];

    for (let pos = 0; pos < document.querySelector('#yearly-expenses').childNodes.length; pos++) {
        let id = document.querySelector('#yearly-expenses').childNodes[pos].dataset.id;
        let desc = document.querySelector('#yearly-expenses').childNodes[pos].querySelector('.desc-history').innerHTML;
        let date = document.querySelector('#yearly-expenses').childNodes[pos].querySelector('.date-history').innerHTML;
        let value = document.querySelector('#yearly-expenses').childNodes[pos].querySelector('.value-history').innerHTML.replace('€', '');

        updatables.push({
            id: id,
            desc: desc,
            date: date,
            value: value
        })
    }

    axios.put(`http://${apiHost}:${apiPort}/update/movements`, updatables)
        .then(async function (response) {
            switchToMonthList(new Date(document.forms["create-movement-div"]["date-input"].value).getMonth() + 1);
            refreshPage();
        })
        .catch(function (error) {
            console.error(error);
        });
}

function deleteMovement(id) {
    axios.get(`http://${apiHost}:${apiPort}/delete/movement/${id}`)
        .then(async function (response) {

        })
        .catch(function (error) {
            console.error(error);

        });

    monthlySpendingsList.sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
    });

    switchToMonthList(new Date(monthlySpendingsList[0].date).getMonth() + 1)
    refreshPage();
}

// <<-------------><--------------------------------->>