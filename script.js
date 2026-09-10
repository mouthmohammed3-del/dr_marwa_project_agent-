// متغير لتخزين بيانات قاعدة المعرفة بعد تحميلها
let knowledgeBase = null;
let currentSubjects = [];

// عناصر واجهة المستخدم
const gradeSelect = document.getElementById('gradeSelect');
const subjectsGroup = document.getElementById('subjectsGroup');
const checkboxesContainer = document.getElementById('checkboxesContainer');
const actionButtons = document.getElementById('actionButtons');
const queryBtn = document.getElementById('queryBtn');
const greedyBtn = document.getElementById('greedyBtn');
const resultsArea = document.getElementById('resultsArea');
const resultsContent = document.getElementById('resultsContent');

// تحميل بيانات JSON من ملف kb.json
async function loadKnowledgeBase() {
    try {
        const response = await fetch('kb.json');
        knowledgeBase = await response.json();
        console.log("تم تحميل قاعدة المعرفة من ملف JSON بنجاح:", knowledgeBase);
        populateGradeDropdown();
    } catch (error) {
        console.warn("تعذر جلب ملف JSON مباشرة بسبب حماية المتصفح، جاري تفعيل النسخة الاحتياطية المدمجة...");
        if (typeof fallbackKnowledgeBase !== 'undefined') {
            knowledgeBase = fallbackKnowledgeBase;
            console.log("تم تفعيل النسخة الاحتياطية بنجاح:", knowledgeBase);
            populateGradeDropdown();
        } else {
            gradeSelect.innerHTML = '<option value="">❌ حدث خطأ في تحميل البيانات.</option>';
        }
    }
}

// تعبئة القائمة المنسدلة بالصفوف الدراسية
function populateGradeDropdown() {
    gradeSelect.innerHTML = '<option value="">-- اختر الصف الدراسي --</option>';
    
    knowledgeBase.educational_stages.forEach(stage => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = stage.stage_name;
        
        stage.grades.forEach(grade => {
            const option = document.createElement('option');
            option.value = grade.grade_id;
            option.textContent = grade.grade_name;
            optgroup.appendChild(option);
        });
        
        gradeSelect.appendChild(optgroup);
    });
}

// عند تغيير اختيار الصف من القائمة المنسدلة
gradeSelect.addEventListener('change', (e) => {
    const selectedGradeId = e.target.value;
    
    if (!selectedGradeId) {
        subjectsGroup.style.display = 'none';
        actionButtons.style.display = 'none';
        resultsArea.style.display = 'none';
        return;
    }

    let selectedGrade = null;
    for (const stage of knowledgeBase.educational_stages) {
        const found = stage.grades.find(g => g.grade_id === selectedGradeId);
        if (found) {
            selectedGrade = found;
            break;
        }
    }

    if (selectedGrade) {
        currentSubjects = selectedGrade.subjects;
        buildCheckboxes(currentSubjects);
        subjectsGroup.style.display = 'block';
        actionButtons.style.display = 'flex';
        resultsArea.style.display = 'none';
    }
});

// بناء مربعات الاختيار
function buildCheckboxes(subjects) {
    checkboxesContainer.innerHTML = ''; 
    subjects.forEach((subject, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'checkbox-wrapper';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `subject_${index}`;
        checkbox.value = index;
        checkbox.checked = true; // نحدد الكل افتراضياً لتسهيل التجربة
        
        const label = document.createElement('label');
        label.htmlFor = `subject_${index}`;
        label.textContent = subject.subject_name;
        
        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);
        checkboxesContainer.appendChild(wrapper);
    });
}

// الاستعلام العادي (البحث الخطي)
queryBtn.addEventListener('click', () => {
    const checkboxes = checkboxesContainer.querySelectorAll('input[type="checkbox"]:checked');
    if (checkboxes.length === 0) {
        alert("يرجى تحديد مادة واحدة على الأقل.");
        return;
    }
    
    resultsArea.className = 'results-container';
    resultsArea.querySelector('h3').innerHTML = '📋 نتائج الاستعلام العادي (Linear Search):';
    resultsArea.querySelector('h3').style.color = '#2980b9';
    resultsContent.innerHTML = ''; 
    
    checkboxes.forEach(cb => {
        const subjectData = currentSubjects[cb.value];
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        resultCard.innerHTML = `
            <h4>📘 المادة: <span>${subjectData.subject_name}</span></h4>
            <p><strong>👨‍🏫 الأستاذ:</strong> ${subjectData.teacher}</p>
            <p><strong>📚 الكتاب:</strong> ${subjectData.book}</p>
        `;
        resultsContent.appendChild(resultCard);
    });
    
    resultsArea.style.display = 'block';
});

// 🧠 خوارزمية التحسين الجشعة (Greedy Set Cover Algorithm)
greedyBtn.addEventListener('click', () => {
    const checkboxes = checkboxesContainer.querySelectorAll('input[type="checkbox"]:checked');
    if (checkboxes.length === 0) {
        alert("يرجى تحديد مواد أولاً لكي تقوم الخوارزمية بتحسينها.");
        return;
    }

    // 1. جمع المواد المطلوبة وتجميع بيانات المعلمين
    let uncoveredSubjects = new Set();
    let teachersMap = {}; // { "اسم المعلم": ["مادة 1", "مادة 2"] }

    checkboxes.forEach(cb => {
        const subjectData = currentSubjects[cb.value];
        uncoveredSubjects.add(subjectData.subject_name);
        
        if (!teachersMap[subjectData.teacher]) {
            teachersMap[subjectData.teacher] = [];
        }
        teachersMap[subjectData.teacher].push(subjectData.subject_name);
    });

    // 2. تطبيق الـ Greedy Algorithm
    let greedySelection = [];
    let logs = []; // لتسجيل خطوات الخوارزمية
    let step = 1;

    while (uncoveredSubjects.size > 0) {
        let bestTeacher = null;
        let subjectsCoveredByBest = [];

        // في كل خطوة: ابحث عن المعلم الذي يغطي أكبر عدد ممكن من المواد "المتبقية"
        for (const [teacher, subjects] of Object.entries(teachersMap)) {
            const coveredHere = subjects.filter(sub => uncoveredSubjects.has(sub));
            if (coveredHere.length > subjectsCoveredByBest.length) {
                bestTeacher = teacher;
                subjectsCoveredByBest = coveredHere;
            }
        }

        if (!bestTeacher) break; // للوقاية من الـ infinite loop

        // الخيار الجشع (Greedy Choice): أضف المعلم الأفضل للنتيجة
        greedySelection.push({
            teacher: bestTeacher,
            subjects: subjectsCoveredByBest
        });

        logs.push(`<strong>خطوة ${step}:</strong> تم اختيار <strong>${bestTeacher}</strong> لأنه يغطي أكبر عدد من المواد المتبقية (${subjectsCoveredByBest.length} مواد: ${subjectsCoveredByBest.join('، ')}).`);
        step++;

        // إزالة المواد التي تم تغطيتها
        subjectsCoveredByBest.forEach(sub => uncoveredSubjects.delete(sub));
    }

    // 3. عرض النتائج الجشعة
    resultsArea.className = 'results-container greedy-mode';
    resultsArea.querySelector('h3').innerHTML = ' نتائج التحسين بالخوارزمية الجشعة (Greedy Algorithm):';
    resultsArea.querySelector('h3').style.color = '#8e44ad';
    
    resultsContent.innerHTML = `
        <div class="greedy-explanation">
            <strong>🎯 الهدف:</strong> إيجاد أقل عدد ممكن من المعلمين لتغطية جميع المواد المطلوبة (Set Cover Problem).<br><br>
            <strong>⚙️ خطوات تفكير الخوارزمية:</strong><br>
            <ul>${logs.map(log => `<li>${log}</li>`).join('')}</ul>
            <strong>✅ النتيجة النهائية:</strong> نحتاج إلى <strong>${greedySelection.length}</strong> معلمين فقط لتغطية ${checkboxes.length} مواد!
        </div>
    `;

    greedySelection.forEach(item => {
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        resultCard.innerHTML = `
            <h4>👨‍🏫 المعلم: <span>${item.teacher}</span></h4>
            <p><strong>📘 المواد التي سيغطيها:</strong> ${item.subjects.join('، ')}</p>
        `;
        resultsContent.appendChild(resultCard);
    });

    resultsArea.style.display = 'block';
});

// تشغيل الدالة عند فتح الصفحة
window.onload = loadKnowledgeBase;
