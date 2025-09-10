const gradeScales = {
    '4.0': [{ grade: 'A', value: 4.0 }, { grade: 'B', value: 3.0 }, { grade: 'C', value: 2.0 }, { grade: 'D', value: 1.0 }, { grade: 'F', value: 0.0 }],
    '5.0': [{ grade: 'A', value: 5.0 }, { grade: 'B', value: 4.0 }, { grade: 'C', value: 3.0 }, { grade: 'D', value: 2.0 }, { grade: 'E', value: 1.0 }, { grade: 'F', value: 0.0 }],
    '7.0': [{ grade: 'A', value: 7.0 }, { grade: 'B', value: 6.0 }, { grade: 'C', value: 5.0 }, { grade: 'D', value: 4.0 }, { grade: 'E', value: 3.0 }, { grade: 'F', value: 0.0 }],
    '10.0': [{ grade: 'O', value: 10.0 }, { grade: 'A+', value: 9.0 }, { grade: 'A', value: 8.0 }, { grade: 'B+', value: 7.0 }, { grade: 'B', value: 6.0 }, { grade: 'C', value: 5.0 }, { grade: 'F', value: 0.0 }]
};

let semesterHistory = [];
let cgpaChart;

document.addEventListener('DOMContentLoaded', () => {
    updateGradeOptions();
    document.getElementById('grading-scale').addEventListener('change', () => {
        updateGradeOptions();
        if (semesterHistory.length > 0) {
            renderHistoryTable();
            updateOverallCGPA();
            updateChart();
        }
    });
});

function updateGradeOptions() {
    const scale = document.getElementById('grading-scale').value;
    const gradeOptions = gradeScales[scale];
    const gradeSelects = document.querySelectorAll('.course-grade');
    
    gradeSelects.forEach(select => {
        const currentVal = select.options[select.selectedIndex]?.text;
        select.innerHTML = '';
        let newSelectedIndex = 0;
        gradeOptions.forEach((opt, index) => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.grade;
            select.appendChild(option);
            if (opt.grade === currentVal) {
                newSelectedIndex = index;
            }
        });
        select.selectedIndex = newSelectedIndex;
    });
}

function addCourse() {
    const container = document.getElementById('courses-container');
    const newCourseRow = container.firstElementChild.cloneNode(true);
    newCourseRow.querySelectorAll('input').forEach(input => input.value = '');
    newCourseRow.querySelector('.btn-danger').style.display = 'inline-flex';
    container.appendChild(newCourseRow);
    updateGradeOptions();
}

function removeCourse(button) {
    // Prevents deleting the last remaining course row
    if (document.querySelectorAll('.course-row').length > 1) {
        button.parentElement.remove();
    }
}

function calculateGPA() {
    const courseRows = document.querySelectorAll('.course-row');
    let totalQualityPoints = 0;
    let totalCreditUnits = 0;

    courseRows.forEach(row => {
        const units = parseFloat(row.querySelector('.course-units').value);
        const gradeValue = parseFloat(row.querySelector('.course-grade').value);
        if (!isNaN(units) && units > 0 && !isNaN(gradeValue)) {
            totalQualityPoints += units * gradeValue;
            totalCreditUnits += units;
        }
    });

    const gpa = totalCreditUnits > 0 ? (totalQualityPoints / totalCreditUnits) : 0;
    document.getElementById('gpa-result').textContent = gpa.toFixed(2);
    document.getElementById('result-display').style.display = 'block';
}

function storeResult() {
    const semesterName = document.getElementById('semester-name').value.trim();
    if (!semesterName) { alert('Please enter a name for the semester.'); return; }

    const courses = [];
    let totalUnitsInSemester = 0;
    document.querySelectorAll('.course-row').forEach(row => {
        const units = parseFloat(row.querySelector('.course-units').value);
        const gradeSelect = row.querySelector('.course-grade');
        const grade = gradeSelect.options[gradeSelect.selectedIndex].text;
        if (!isNaN(units) && units > 0) {
            courses.push({ units, grade });
            totalUnitsInSemester += units;
        }
    });

    if (totalUnitsInSemester === 0) { alert('Cannot store a semester with 0 credit units.'); return; }
    
    semesterHistory.push({ name: semesterName, courses: courses });
    document.getElementById('semester-name').value = '';
    document.getElementById('result-display').style.display = 'none';
    document.getElementById('history-card').style.display = 'block';
    
    renderHistoryTable();
    updateOverallCGPA();
}

function calculateGpaForSemester(semester, scaleValue) {
    const gradeMap = new Map(gradeScales[scaleValue].map(g => [g.grade, g.value]));
    let totalQualityPoints = 0;
    let totalCreditUnits = 0;
    
    semester.courses.forEach(course => {
        totalCreditUnits += course.units;
        totalQualityPoints += (gradeMap.get(course.grade) || 0) * course.units;
    });
    
    const gpa = totalCreditUnits > 0 ? (totalQualityPoints / totalCreditUnits) : 0;
    return { gpa, totalQualityPoints, totalCreditUnits };
}

function renderHistoryTable() {
    const tableBody = document.querySelector('#history-table tbody');
    const currentScale = document.getElementById('grading-scale').value;
    tableBody.innerHTML = '';

    semesterHistory.forEach((semester, index) => {
        const { gpa } = calculateGpaForSemester(semester, currentScale);
        const row = `
            <tr>
                <td><input type="checkbox" onchange="updateChart()" data-index="${index}"></td>
                <td>${semester.name}</td>
                <td>${gpa.toFixed(2)}</td>
                <td><button class="btn-danger" onclick="deleteSemester(${index})">&times;</button></td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
}

function deleteSemester(index) {
    semesterHistory.splice(index, 1);
    renderHistoryTable();
    updateOverallCGPA();
    updateChart();

    if (semesterHistory.length === 0) {
        document.getElementById('history-card').style.display = 'none';
    }
}

function getDegreeClassification(cgpa, maxScale) {
    if (cgpa <= 0 || !isFinite(cgpa)) return '';
    const normalizedCgpa = (cgpa / maxScale) * 4.0;
    let classification = '';
    if (normalizedCgpa >= 3.50) classification = 'First Class Honours';
    else if (normalizedCgpa >= 3.00) classification = 'Second Class Honours (Upper Division)';
    else if (normalizedCgpa >= 2.00) classification = 'Second Class Honours (Lower Division)';
    else if (normalizedCgpa >= 1.00) classification = 'Third Class Honours';
    else classification = 'Fail';
    return `Classification: ${classification}`;
}

function updateOverallCGPA() {
    const currentScale = document.getElementById('grading-scale').value;
    const cgpaResultElem = document.getElementById('cgpa-result');
    const cgpaCommentElem = document.getElementById('cgpa-comment');

    if (semesterHistory.length === 0) {
        cgpaResultElem.textContent = '0.00';
        cgpaCommentElem.textContent = '';
        return;
    }

    let cumulativeQualityPoints = 0;
    let cumulativeCreditUnits = 0;
    
    semesterHistory.forEach(semester => {
        const { totalQualityPoints, totalCreditUnits } = calculateGpaForSemester(semester, currentScale);
        cumulativeQualityPoints += totalQualityPoints;
        cumulativeCreditUnits += totalCreditUnits;
    });
    
    const cgpa = cumulativeCreditUnits > 0 ? (cumulativeQualityPoints / cumulativeCreditUnits) : 0;
    cgpaResultElem.textContent = cgpa.toFixed(2);
    cgpaCommentElem.textContent = getDegreeClassification(cgpa, parseFloat(currentScale));
}

function updateChart() {
    const selectedIndices = Array.from(document.querySelectorAll('#history-table tbody input:checked')).map(cb => parseInt(cb.dataset.index));
    const currentScale = document.getElementById('grading-scale').value;

    const labels = selectedIndices.map(index => semesterHistory[index].name);
    const dataPoints = selectedIndices.map(index => calculateGpaForSemester(semesterHistory[index], currentScale).gpa);
    
    if (cgpaChart) cgpaChart.destroy();
    const chartCanvas = document.getElementById('cgpa-chart');
    if (selectedIndices.length < 2) {
        chartCanvas.style.display = 'none';
        return;
    }

    chartCanvas.style.display = 'block';
    const ctx = chartCanvas.getContext('2d');
    cgpaChart = new Chart(ctx, {
        type: 'line', 
        data: {
            labels: labels,
            datasets: [{
                label: 'GPA per Semester',
                data: dataPoints,
                backgroundColor: 'rgba(94, 222, 255, 0.1)',
                borderColor: '#5EDEFF',
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#5EDEFF',
                pointHoverRadius: 8,
                pointRadius: 6,
                tension: 0.4,
                fill: true,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: parseFloat(currentScale),
                    ticks: { color: 'rgba(255, 255, 255, 0.8)', font: { size: 14 } },
                    grid: { color: 'rgba(255,255,255,0.15)', drawBorder: false }
                },
                x: {
                     ticks: { color: 'rgba(255, 255, 255, 0.8)', font: { size: 14 } },
                     grid: { display: false }
                }
            },
            plugins: {
                legend: { labels: { color: 'rgba(255, 255, 255, 0.9)', font: { size: 16 } } },
                tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.7)', bodyColor: '#fff', titleColor: '#5EDEFF', titleFont: { size: 16, weight: 'bold' }, bodyFont: { size: 14 }, cornerRadius: 8, padding: 12 }
            }
        }
    });
}