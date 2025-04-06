const processForm = document.getElementById('process-form');
const processList = document.getElementById('process-list');
const output = document.getElementById('output');
const simulateBtn = document.getElementById('simulate');
const algorithm = document.getElementById('algorithm');
const quantumInput = document.getElementById('quantum');
const resetBtn = document.getElementById('reset');

let processes = [];

processForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const pid = document.getElementById('pid').value;
  const arrival = parseInt(document.getElementById('arrival').value);
  const burst = parseInt(document.getElementById('burst').value);
  const priority = parseInt(document.getElementById('priority').value) || 0;
  processes.push({ pid, arrival, burst, priority });
  renderProcessList();
  this.reset();
});

algorithm.addEventListener('change', () => {
  quantumInput.style.display = algorithm.value === 'rr' ? 'inline-block' : 'none';
});

simulateBtn.addEventListener('click', () => {
  const algo = algorithm.value;
  if (processes.length === 0) {
    output.innerHTML = "<p>Please add at least one process.</p>";
    return;
  }

  if (algo === 'fcfs') simulateFCFS();
  else if (algo === 'sjf') simulateSJF();
  else if (algo === 'priority') simulatePriority();
  else if (algo === 'rr') simulateRR();
});

resetBtn.addEventListener('click', () => {
  processes = [];
  processList.innerHTML = '';
  output.innerHTML = '';
});

function renderProcessList() {
  processList.innerHTML = '';
  processes.forEach(p => {
    processList.innerHTML += `<li>${p.pid} - Arrival: ${p.arrival}, Burst: ${p.burst}, Priority: ${p.priority}</li>`;
  });
}

function simulateFCFS() {
  processes.sort((a, b) => a.arrival - b.arrival);
  let time = 0, totalWT = 0, totalTAT = 0;
  let chartData = [], result = '<h3>FCFS Scheduling</h3><ul>';

  processes.forEach(p => {
    if (time < p.arrival) time = p.arrival;
    const start = time;
    const wt = time - p.arrival;
    const tat = wt + p.burst;
    totalWT += wt;
    totalTAT += tat;
    time += p.burst;
    const end = time;

    chartData.push({ pid: p.pid, start, end });
    result += `<li>${p.pid}: WT=${wt}, TAT=${tat}</li>`;
  });

  result += `</ul><p>Avg WT: ${(totalWT / processes.length).toFixed(2)}</p>`;
  result += `<p>Avg TAT: ${(totalTAT / processes.length).toFixed(2)}</p>`;
  result += renderGanttChart(chartData);
  output.innerHTML = result;
}


function simulateSJF() {
  let queue = [...processes];
  let time = 0, totalWT = 0, totalTAT = 0;
  let result = '<h3>SJF Scheduling</h3><ul>';
  let completed = [];
  let chartData = [];

  while (queue.length > 0) {
    let available = queue.filter(p => p.arrival <= time);
    if (available.length === 0) {
      time++;
      continue;
    }

    available.sort((a, b) => a.burst - b.burst);
    let next = available[0];
    const start = time;
    const wt = time - next.arrival;
    const tat = wt + next.burst;
    const end = start + next.burst;

    completed.push({ pid: next.pid, wt, tat });
    totalWT += wt;
    totalTAT += tat;
    chartData.push({ pid: next.pid, start, end });
    time += next.burst;
    queue = queue.filter(p => p !== next);
  }

  completed.forEach(p => {
    result += `<li>${p.pid}: WT=${p.wt}, TAT=${p.tat}</li>`;
  });

  result += `</ul><p>Avg WT: ${(totalWT / completed.length).toFixed(2)}</p>`;
  result += `<p>Avg TAT: ${(totalTAT / completed.length).toFixed(2)}</p>`;
  result += renderGanttChart(chartData);
  output.innerHTML = result;
}


function simulatePriority() {
  let queue = [...processes];
  let time = 0, totalWT = 0, totalTAT = 0;
  let result = '<h3>Priority Scheduling</h3><ul>';
  let completed = [];
  let chartData = [];

  while (queue.length > 0) {
    let available = queue.filter(p => p.arrival <= time);
    if (available.length === 0) {
      time++;
      continue;
    }

    available.sort((a, b) => a.priority - b.priority);
    let next = available[0];
    const start = time;
    const wt = time - next.arrival;
    const tat = wt + next.burst;
    const end = start + next.burst;

    completed.push({ pid: next.pid, wt, tat });
    totalWT += wt;
    totalTAT += tat;
    chartData.push({ pid: next.pid, start, end });
    time += next.burst;
    queue = queue.filter(p => p !== next);
  }

  completed.forEach(p => {
    result += `<li>${p.pid}: WT=${p.wt}, TAT=${p.tat}</li>`;
  });

  result += `</ul><p>Avg WT: ${(totalWT / completed.length).toFixed(2)}</p>`;
  result += `<p>Avg TAT: ${(totalTAT / completed.length).toFixed(2)}</p>`;
  result += renderGanttChart(chartData);
  output.innerHTML = result;
}


function simulateRR() {
  let quantum = parseInt(quantumInput.value);
  if (!quantum || quantum <= 0) {
    output.innerHTML = "<p>Please enter a valid quantum.</p>";
    return;
  }

  let queue = processes.map(p => ({
    ...p,
    remaining: p.burst,
    completed: false
  }));

  let time = 0;
  let completed = 0;
  let totalWT = 0;
  let totalTAT = 0;
  let chartData = [];

  const readyQueue = [];

  while (completed < queue.length) {
    queue
      .filter(p => p.arrival <= time && !readyQueue.includes(p) && p.remaining > 0)
      .forEach(p => readyQueue.push(p));

    if (readyQueue.length === 0) {
      time++;
      continue;
    }

    const current = readyQueue.shift();
    const execTime = Math.min(quantum, current.remaining);
    const start = time;
    time += execTime;
    current.remaining -= execTime;
    const end = time;
    chartData.push({ pid: current.pid, start, end });

    // Add newly arrived processes to ready queue
    queue
      .filter(p => p.arrival <= time && !readyQueue.includes(p) && p.remaining > 0 && p !== current)
      .forEach(p => readyQueue.push(p));

    // Requeue current if not finished
    if (current.remaining > 0) {
      readyQueue.push(current);
    } else {
      current.completed = true;
      completed++;
      const wt = time - current.arrival - current.burst;
      const tat = time - current.arrival;
      totalWT += wt;
      totalTAT += tat;
    }
  }

  let result = `<h3>Round Robin (Quantum = ${quantum})</h3>`;
  result += `<p>Avg WT: ${(totalWT / queue.length).toFixed(2)}</p>`;
  result += `<p>Avg TAT: ${(totalTAT / queue.length).toFixed(2)}</p>`;
  result += renderGanttChart(chartData);
  output.innerHTML = result;
}

function renderGanttChart(chartData) {
  let chartHTML = '<h3>Gantt Chart</h3><div class="gantt-container">';
  chartData.forEach(block => {
    chartHTML += `
      <div class="gantt-block">
        <div class="gantt-label">${block.pid}</div>
        <div class="gantt-time">${block.start} - ${block.end}</div>
      </div>
    `;
  });
  chartHTML += '</div>';
  return chartHTML;
}
