// متغير لتخزين بيانات قاعدة المعرفة بعد تحميلها
let knowledgeBase = null;
let currentSubjects = [];

// عناصر واجهة المستخدم
const gradeSelect = document.getElementById('gradeSelect');
const subjectsGroup = document.getElementById('subjectsGroup');
const checkboxesContainer = document.getElementById('checkboxesContainer');
const queryBtn = document.getElementById('queryBtn');
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
    
    // المرور على جميع المراحل والصفوف في ملف JSON
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
        queryBtn.style.display = 'none';
        resultsArea.style.display = 'none';
        return;
    }

    // البحث عن الصف المحدد في قاعدة المعرفة
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
        queryBtn.style.display = 'block';
        resultsArea.style.display = 'none'; // إخفاء النتائج السابقة
    }
});

// بناء مربعات الاختيار (Checkboxes) للمواد
function buildCheckboxes(subjects) {
    checkboxesContainer.innerHTML = ''; // تفريغ المحتوى السابق
    
    subjects.forEach((subject, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'checkbox-wrapper';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `subject_${index}`;
        checkbox.value = index;
        
        const label = document.createElement('label');
        label.htmlFor = `subject_${index}`;
        label.textContent = subject.subject_name;
        
        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);
        checkboxesContainer.appendChild(wrapper);
    });
}

// عند الضغط على زر الاستعلام
queryBtn.addEventListener('click', () => {
    const checkboxes = checkboxesContainer.querySelectorAll('input[type="checkbox"]:checked');
    
    if (checkboxes.length === 0) {
        alert("يرجى تحديد مادة واحدة على الأقل للاستعلام عنها.");
        return;
    }
    
    resultsContent.innerHTML = ''; // تفريغ النتائج
    
    // استخراج معلومات المواد المحددة وعرضها
    checkboxes.forEach(cb => {
        const subjectIndex = cb.value;
        const subjectData = currentSubjects[subjectIndex];
        
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        
        resultCard.innerHTML = `
            <h4>📘 المادة: <span>${subjectData.subject_name}</span></h4>
            <p><strong>👨‍🏫 أستاذ المادة:</strong> ${subjectData.teacher}</p>
            <p><strong>📚 الكتاب المقرر:</strong> ${subjectData.book}</p>
        `;
        
        resultsContent.appendChild(resultCard);
    });
    
    resultsArea.style.display = 'block';
});

// تشغيل الدالة عند فتح الصفحة
window.onload = loadKnowledgeBase;
