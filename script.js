// ===== PWA Service Worker Registration =====
// This block registers the sw.js file, enabling PWA functionality (caching/offline access).
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered: ', reg.scope))
            .catch(err => console.log('Service Worker registration failed: ', err));
    });
}
// ===========================================


// ===== Sidebar Toggle =====
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('sidebar');
menuBtn.addEventListener('click', () => {
    sidebar.style.left = (sidebar.style.left === '0px' || sidebar.style.left === '') ? '-220px' : '0px';
});

// ===== Dark/Light Mode Toggle =====
const header = document.querySelector('header');
const modeBtn = document.createElement('span');
modeBtn.id = 'mode-btn';
modeBtn.textContent = '🌙';
header.appendChild(modeBtn);

modeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    modeBtn.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
});

// ===== Page Navigation =====
const pages = document.querySelectorAll('.page');
const menuItems = sidebar.querySelectorAll('li');
menuItems.forEach(li => {
    li.addEventListener('click', () => {
        pages.forEach(p => p.classList.remove('active'));
        document.getElementById(li.dataset.page).classList.add('active');
        sidebar.style.left = '-220px';
        switch (li.dataset.page) {
            case 'tracker-page': renderTable(); break;
            case 'status-page': renderStatus(); break;
            case 'trend-page': renderCharts(); break;
        }
    });
});

// ===== Transactions Dataset =====
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let editIndex = null;

// ===== Form Elements =====
const form = document.getElementById('transaction-form');
const dateInput = document.getElementById('date');
const typeInput = document.getElementById('type');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const accountInput = document.getElementById('account');
const noteInput = document.getElementById('note');
const addBtn = document.getElementById('add-btn');
const updateBtn = document.getElementById('update-btn');
const deleteBtn = document.getElementById('delete-btn');

// ===== Default Month Pickers =====
function setDefaultMonthPickers() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    ['month-filter', 'status-month', 'trend-month'].forEach(id => {
        const input = document.getElementById(id);
        if (input && !input.value) input.value = currentMonth;
    });
}
setDefaultMonthPickers();

// ===== Form Submit =====
form.addEventListener('submit', e => {
    e.preventDefault();
    const data = {
        date: dateInput.value,
        type: typeInput.value,
        amount: parseFloat(amountInput.value),
        category: categoryInput.value,
        account: accountInput.value,
        note: noteInput.value
    };
    if (editIndex !== null) {
        transactions[editIndex] = data;
        editIndex = null;
        updateBtn.classList.add('hidden');
        deleteBtn.classList.add('hidden');
        addBtn.classList.remove('hidden');
    } else {
        transactions.push(data);
    }
    localStorage.setItem('transactions', JSON.stringify(transactions));
    form.reset();
    renderTable();
    renderStatus();
    renderCharts();
});

// ===== Tracker Page =====
const trackerTableBody = document.querySelector('#tracker-table tbody');
function renderTable() {
    const filterMonth = document.getElementById('month-filter').value;
    trackerTableBody.innerHTML = '';
    transactions.forEach((t, idx) => {
        if (filterMonth && !t.date.startsWith(filterMonth)) return;
        const row = document.createElement('tr');
        Object.entries(t).forEach(([key, val]) => {
            const td = document.createElement('td');
            td.textContent = key === 'date'
                ? new Date(val).toLocaleDateString('en-US',{month:'short',day:'2-digit'}).replace(' ','-')
                : val;
            row.appendChild(td);
        });
        row.addEventListener('click', () => loadTransaction(idx));
        trackerTableBody.appendChild(row);
    });
}
document.getElementById('month-filter').addEventListener('input', renderTable);

// ===== Load Transaction =====
function loadTransaction(idx) {
    const t = transactions[idx];
    dateInput.value = t.date;
    typeInput.value = t.type;
    amountInput.value = t.amount;
    categoryInput.value = t.category;
    accountInput.value = t.account;
    noteInput.value = t.note;
    editIndex = idx;
    addBtn.classList.add('hidden');
    updateBtn.classList.remove('hidden');
    deleteBtn.classList.remove('hidden');
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById('input-page').classList.add('active');
}

// ===== Update & Delete =====
updateBtn.addEventListener('click', () => form.dispatchEvent(new Event('submit')));
deleteBtn.addEventListener('click', () => {
    if (editIndex !== null) {
        transactions.splice(editIndex, 1);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        form.reset();
        editIndex = null;
        updateBtn.classList.add('hidden');
        deleteBtn.classList.add('hidden');
        addBtn.classList.remove('hidden');
        renderTable();
        renderStatus();
        renderCharts();
    }
});

// ===== Status Page =====
function renderStatus() {
    const monthlyBody = document.querySelector('#monthly-summary tbody');
    const dailyBody = document.querySelector('#daily-summary tbody');
    const selectedMonth = document.getElementById('status-month')?.value || '';
    const monthlyData = {};
    const dailyData = {};
    transactions.forEach(t => {
        const monthKey = t.date.slice(0,7);
        const day = t.date;
        if (selectedMonth && !t.date.startsWith(selectedMonth)) return;
        if (!monthlyData[monthKey]) monthlyData[monthKey] = {Budget:0, Expense:0};
        if (!dailyData[day]) dailyData[day] = {Budget:0, Expense:0};
        monthlyData[monthKey][t.type] += t.amount;
        dailyData[day][t.type] += t.amount;
    });

    monthlyBody.innerHTML = '';
    Object.keys(monthlyData).sort().forEach(monthKey=>{
        const data = monthlyData[monthKey];
        const balance = data.Budget - data.Expense;
        const balanceClass = balance >= 0 ? 'positive' : 'negative';
        const monthName = new Date(monthKey+'-01').toLocaleString('en-US',{month:'short'});
        monthlyBody.innerHTML += `<tr>
            <td>${monthName}</td>
            <td>${data.Budget||0}</td>
            <td>${data.Expense||0}</td>
            <td class="${balanceClass}">${balance}</td>
        </tr>`;
    });

    dailyBody.innerHTML = '';
    Object.keys(dailyData).sort().forEach(day=>{
        const data = dailyData[day];
        const balance = data.Budget - data.Expense;
        const balanceClass = balance >= 0 ? 'positive' : 'negative';
        const formattedDay = new Date(day).toLocaleDateString('en-US',{month:'short',day:'2-digit'}).replace(' ','-');
        dailyBody.innerHTML += `<tr>
            <td>${formattedDay}</td>
            <td>${data.Budget||0}</td>
            <td>${data.Expense||0}</td>
            <td class="${balanceClass}">${balance}</td>
        </tr>`;
    });
}
document.getElementById('status-month')?.addEventListener('input', renderStatus);

// ===== Trend Page =====
function renderCharts() {
    const selectedMonth = document.getElementById('trend-month')?.value || '';
    const ctxDaily = document.getElementById('dailyChart').getContext('2d');
    const ctxCategory = document.getElementById('categoryChart').getContext('2d');

    const dailyMap = {};
    transactions.forEach(t=>{
        if(t.type==='Expense'){
            if(selectedMonth && !t.date.startsWith(selectedMonth)) return;
            dailyMap[t.date]=(dailyMap[t.date]||0)+t.amount;
        }
    });
    const dailyLabels = Object.keys(dailyMap).sort();
    const dailyValues = dailyLabels.map(d=>dailyMap[d]);
    const dailyLabelsFormatted = dailyLabels.map(d=>new Date(d).toLocaleDateString('en-US',{month:'short',day:'2-digit'}).replace(' ','-'));

    const categoryMap = {};
    transactions.forEach(t=>{
        if(t.type==='Expense'){
            if(selectedMonth && !t.date.startsWith(selectedMonth)) return;
            categoryMap[t.category]=(categoryMap[t.category]||0)+t.amount;
        }
    });
    const categoryLabels = Object.keys(categoryMap);
    const categoryValues = Object.values(categoryMap);
    const colors=['red','green','blue','yellow','orange','purple','pink','brown'];

    if(window.dailyChartInstance) window.dailyChartInstance.destroy();
    if(window.categoryChartInstance) window.categoryChartInstance.destroy();

    window.dailyChartInstance = new Chart(ctxDaily,{
        type:'bar',
        data:{labels:dailyLabelsFormatted,datasets:[{label:'Expense',data:dailyValues,backgroundColor:'#007bff'}]},
        options:{responsive:true,plugins:{legend:{display:true,position:'bottom',align:'center',labels:{font:{size:10},usePointStyle:true,pointStyle:'circle'}}}}
    });

    window.categoryChartInstance = new Chart(ctxCategory,{
        type:'pie',
        data:{labels:categoryLabels,datasets:[{data:categoryValues,backgroundColor:colors.slice(0,categoryLabels.length)}]},
        options:{responsive:true,plugins:{legend:{display:true,position:'bottom',align:'center',labels:{font:{size:10},usePointStyle:true,pointStyle:'circle'}}}}
    });
}
document.getElementById('trend-month')?.addEventListener('input', renderCharts);

// ===== Backup Page =====
// Clear All Data
document.getElementById('clear-data-btn').addEventListener('click', () => {
    if(confirm("Are you sure you want to clear all data?")) {
        localStorage.clear();
        transactions = [];
        alert("All data cleared!");
        renderTable();
        renderStatus();
        renderCharts();
    }
});

// Export Data to CSV
document.getElementById('export-data-btn').addEventListener('click', () => {
    if(transactions.length === 0){
        alert("No data to export!");
        return;
    }
    let csvContent = "Date,Type,Amount,Category,Account,Note\n";
    transactions.forEach(t=>{
        csvContent += `${t.date},${t.type},${t.amount},${t.category},${t.account},${t.note}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Backup_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
});

// ===== Initial Rendering =====
renderTable();
renderStatus();
renderCharts();