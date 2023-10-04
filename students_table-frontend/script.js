(function(){
    const tableBody = document.getElementById('table-body');

    const SERVER_REQUEST_HANDLER = {

        getStudentsList:  () => {
            return new Promise(async(resolve, reject) => {
                const response = await fetch('http://localhost:3000/api/students', {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                    });
                    const data = await response.json();
                    resolve (data);
            }).then(value => {return value;});
        },

        createStudentRecord: async (obj) => {
            const response = await fetch('http://localhost:3000/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    surname: obj.surname,
                    name: obj.name,
                    lastname: obj.lastname,
                    birthday: obj.birthday,
                    studyStart: obj.studyStart,
                    faculty: obj.faculty,
                })
            });
        },

        deleteStudentRecord: async (itemId) => {
            const response = await fetch(`http://localhost:3000/api/students/${itemId}`, {
                method: 'DELETE',
            });
            if (response.status === 404)
                console.log('Не удалось удалить дело, так как его не существует');
        },
    }

    function createStartDateOptions() {
        const select = document.getElementById('student_start_date');
        const firstDate = Number(select.value);
        const correntYear = new Date().getFullYear();

        for (let i = firstDate+1; i <= correntYear; i++) {
            const option = document.createElement('option');
            option.setAttribute('value', i);
            option.innerText = i;
            select.append(option);
        }
    }
    createStartDateOptions();

    function createTableElement(objStudent) {

        const currentYear = new Date().getFullYear();

        const tableRow = document.createElement('tr');
        const tableCellName = document.createElement('td');
        tableCellName.style.display = 'flex';
        tableCellName.style.justifyContent = 'space-between';
        tableCellName.style.alignItems = 'center';
        const nameCellText = document.createElement('p');
        nameCellText.style.margin = '0';
        nameCellText.textContent = objStudent.surname + ' ' + objStudent.name + ' ' + objStudent.lastname;
        const deleteStudentBtn = document.createElement('button');
        deleteStudentBtn.innerText = 'удалить';
        deleteStudentBtn.classList.add('btn');
        deleteStudentBtn.classList.add('btn-outline-primary');
        deleteStudentBtn.classList.add('btn-sm');

        deleteStudentBtn.addEventListener('click', () => {
            if(confirm('Вы уверены?')) {
                SERVER_REQUEST_HANDLER.deleteStudentRecord(objStudent.id);
                tableRow.remove();
            }
        })

        tableCellName.append(nameCellText);
        tableCellName.append(deleteStudentBtn);
        tableRow.append(tableCellName);

        for(let  [key, value] of Object.entries(objStudent)) {

            const tableCell = document.createElement('td')

            if (key === 'birthday') {
                const date = new Date(value);
                let birthDay = date.getDate();
                if (birthDay < 10) {
                    birthDay = '0' + birthDay;
                }
                let birthMonth = date.getMonth() + 1;
                if (birthMonth < 10) {
                    birthMonth = '0' + birthMonth;
                }
                const birthYear = date.getFullYear();
                const dateForTable = birthDay + '.' + birthMonth + '.' + birthYear;
                const studentAge = currentYear - birthYear;

                let ageText = ' (' + studentAge + ' лет)';
                if (studentAge > 19) {
                    const year = studentAge % 10;
                    switch (year) {
                        case 1: ageText = ' (' + studentAge + ' год)';
                            break;
                        case 2: ageText = ' (' + studentAge + ' года)';
                            break;
                        case 3: ageText = ' (' + studentAge + ' года)';
                            break;
                        case 4: ageText = ' (' + studentAge + ' года)';
                            break;
            
                        default: ageText = ' (' + studentAge + ' лет)';
                            break;
                    }
                }
                tableCell.textContent = dateForTable + ageText;
                tableRow.append(tableCell);

            } else if (key === 'studyStart') {

                const startYear = value;
                const studentCours = currentYear - startYear;
                const yearOfEnding = Number(startYear) + 4;
                let coursText = '';

                switch (studentCours) {
                    case 0: coursText = '(1 курс)'
                        break;
                    case 1: coursText = '(2 курс)'
                        break;
                    case 2: coursText = '(3 курс)'
                        break;
                    case 3: coursText = '(4 курс)'
                        break;
                }

                if (new Date('9.30.' + yearOfEnding) < new Date()) {
                    coursText = '(закончил курс)'
                }

                tableCell.textContent = value + ' - ' + yearOfEnding + ' ' + coursText;
                tableRow.append(tableCell);

            } else if (key === 'faculty'){

                tableCell.textContent = value;
                tableRow.append(tableCell);
            }
        }
            
        return tableRow;
    }

    async function getArr() {
        const students = await SERVER_REQUEST_HANDLER.getStudentsList();
        return students;
    }

    async function fillTheTableBody (arr) {
        const arrStuddents = await arr;
        tableBody.innerHTML = '';
        for (let i = 0; i < arrStuddents.length; i++) {
            tableBody.append(createTableElement(arrStuddents[i]));
        }
    }

    fillTheTableBody(getArr());

    function processInputText(input) {
        const inputField = document.getElementById(input);
        const inputName = inputField.getAttribute('name');
        let valueInput = inputField.value.trim();
        valueInput = valueInput.replaceAll(' ', '');
        valueInput = valueInput.toUpperCase();
        valueInput = valueInput.slice(0,1) + valueInput.slice(1).toLowerCase();

        return {
            valueInput,
            inputName
        }
    }

    function clearForm(arrayInput) {
        for (let i = 0; i < arrayInput.length; i++) {
            if (arrayInput[i].id === 'student_start_date') {
                arrayInput[i].value = '2018';
            } else {
                arrayInput[i].value = '';
                const par = arrayInput[i].parentNode;
                const blockAlert = par.querySelector('.alert');
                blockAlert.classList.add('d-none');
            }
        }
    }

    function filter (arr, searchValue, nameInput) {
        let resaultSerach = [];
        let copyArray = [...arr];
        for (let i = 0; i < copyArray.length; i++) {
            for (const [studentProp, studentPropValue] of Object.entries(copyArray[i]) ) {
                const value = studentPropValue.toLowerCase();
                const search = searchValue.toLowerCase();
                if (nameInput === 'fio' && studentProp === 'name' && value.includes(search) || studentProp === 'surname' && value.includes(search) || studentProp === 'lastname' && value.includes(search)) {
                    resaultSerach.push(copyArray[i]);
                    break;
                } else if(nameInput === 'first-year' && studentProp === 'studyStart' && value === search) {
                    resaultSerach.push(copyArray[i]);
                    break;
                } else if (nameInput === 'last-year' && studentProp === 'studyStart' && Number(value) + 4 === Number(search)) {
                    console.log(copyArray[i]);
                    resaultSerach.push(copyArray[i]);
                    break;
                } else if (nameInput === 'facult' && studentProp === 'faculty' && value.includes(search)) {
                    console.log(copyArray[i]);
                    resaultSerach.push(copyArray[i]);
                    break;
                }
            }
        }
        return resaultSerach;
    }

    async function filterStudents(arr) {
        const arrCopy = await arr;
        let newStudentArr = [...arrCopy];
        const searchName = processInputText('fio');
        const fioSubstr = searchName.valueInput;
        const fioInputName = searchName.inputName;

        const searchStartYear = processInputText('first-year');
        const startYearSubstr = searchStartYear.valueInput;
        const startYearInputName = searchStartYear.inputName;

        const searchLastYear = processInputText('last-year');
        const lastYearSubstr = searchLastYear.valueInput;
        const lastYearInputName = searchLastYear.inputName;

        const searchFacult = processInputText('facult');
        const facultSubstr = searchFacult.valueInput;
        const facultInputName = searchFacult.inputName;

        if (searchName !== '') newStudentArr = filter (newStudentArr, fioSubstr, fioInputName);
        if (searchFacult !== '') newStudentArr = filter (newStudentArr, facultSubstr, facultInputName);
        if (searchStartYear !== '') newStudentArr = filter (newStudentArr, startYearSubstr, startYearInputName);
        if (searchLastYear !== '') newStudentArr = filter (newStudentArr, lastYearSubstr, lastYearInputName);
        fillTheTableBody (newStudentArr);
    }

    const filterForm = document.getElementById('filter-form');

    filterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const arrayForFilter = await getArr();
        await filterStudents(arrayForFilter);
    })

    let sortingDirection = true;
    
    const buttonsForSort = document.getElementsByClassName('sort-btn');

    for (let i = 0; i < buttonsForSort.length; i++) {

        buttonsForSort[i].addEventListener('click', async () => {

            for (let j = 0; j < buttonsForSort.length; j++) {

                buttonsForSort[j].classList.remove('sort-btn-circle');

            }

            buttonsForSort[i].classList.add('sort-btn-circle');

            const property = buttonsForSort[i].id;

            const studentsArray = await getArr();

            const sortStudent = sortArrayStudent(studentsArray, property, sortingDirection);

            fillTheTableBody(sortStudent);

            if (sortingDirection === true) {
                sortingDirection = false
            } else sortingDirection = true;

        })
    }

    const sortArrayStudent = (arrayStudent, studentProperty, dir) => arrayStudent.sort((studentA, studentB) => (!dir ? studentA[studentProperty] < studentB[studentProperty] : studentA[studentProperty] > studentB[studentProperty]) ? -1 : 1);


    const form = document.getElementById('add_student');

    const studentInfo = document.getElementsByClassName('student-info');

    function checkTheFormForEmptiness() {
        let emptyField = false;
        for (let i = 0; i < studentInfo.length; i++) {
            const parent = studentInfo[i].parentNode;
            const alertBlock = parent.querySelector('.alert');
            let formElementDate = studentInfo[i].value.trim();
            formElementDate = formElementDate.replaceAll(' ', '');
            if (formElementDate === '') {
                emptyField = true;
                alertBlock.classList.remove('d-none');
            } else {
                alertBlock.classList.add('d-none');
            }
        }
        if (emptyField === true) {
            return false;
        } else{
            return true;
        }
    }
    

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        checkTheFormForEmptiness();

        if (checkTheFormForEmptiness() !== false) {
            const studentName = processInputText('student_name').valueInput;
            const studentSurname = processInputText('student_surname').valueInput;
            const studentMiddleName = processInputText('student_middle_name').valueInput;
            const studentFaculty = processInputText('student_faculty').valueInput;

            const studentDateOfBirth = document.getElementById('student_date_of_birth').valueAsDate;

            const studentStartDate = Number(document.getElementById('student_start_date').value);

            const currDate = new Date();


            const dateInput = document.getElementById('student_date_of_birth');
            const parentInputDate = dateInput.parentNode;
            const alert = parentInputDate.querySelector('.alert');

            if(studentDateOfBirth < new Date('01.01.1900') || studentDateOfBirth > currDate || studentDateOfBirth === ''){
                alert.classList.remove('d-none');
                return false;
            }else {
                alert.classList.add('d-none');
            }

            const student = {
                surname: studentSurname,
                name: studentName,
                lastname: studentMiddleName,
                birthday: studentDateOfBirth,
                studyStart: studentStartDate,
                faculty: studentFaculty
            }

            SERVER_REQUEST_HANDLER.createStudentRecord(student);

            tableBody.append(createTableElement(student));

            clearForm(studentInfo);
        }
        
    })
    
})()