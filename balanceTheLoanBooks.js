class LoanBooks{
    constructor(){
        this.loans=[]
        this.facilities=[]
        this.covenants=[]
        this.banks=[]
        this.assignments=[]
        this.yields={}
        this.test=null
        //this.test = $.csv.toArray('affirm-take-home-interview-sept-2018/large/banks.csv')
    }
    setDummyData(){ //sets dummy data to all arrays for simple case testing
        this.loans = [
            {interest_rate: 0.15, amount: 10552, id:1, default_likelihood: 0.02, state: 'MO'},
            {interest_rate: 0.15, amount: 51157, id:2, default_likelihood: 0.01, state: 'VT'},
            {interest_rate: 0.35, amount: 74965, id:3, default_likelihood: 0.06, state: 'AL'}
        ]
        this.facilities = [
            {amount: 61104, interest_rate: 0.07, id: 2, bank_id: 1},
            {amount: 126122, interest_rate: 0.06, id: 1, bank_id: 2}
        ]
        this.covenants = [
            {facility_id: 2, max_default_likelihood: 0.09, bank_id: 1, banned_state: 'MT'},
            {facility_id: 1, max_default_likelihood: 0.06, bank_id: 2, banned_state: 'VT'},
            {facility_id: 1, max_default_likelihood: null, bank_id: 2, banned_state: 'CA'}
        ]
        this.banks = [
            {id: 1, name: 'Chase'},
            {id: 2, name: 'Bank of America'}
        ]
    }
    /*
    name: assignLoansToFacilities
    arguments: none - using the class properties
    functionality:
        1. for each loan in this.loans:
            1.1 find all suitable facilities from this.facilities
                fcreteria: -facility needs to hav enough fundings
                           - facility needs to be able to support the loan's state
                           - facility's max_default_likelihood >= loan's default_likelihood
            
            1.2 from the list of suitable facilities choose the facility with the lowest: interest_rate
            1.3 update the chosen facility's "amount" to reflect the amount that is left after the loan assignment
        2. output: an array or objects that each object represent and assignment of a loan to a facility. Every assignment object
                   has two keys: laon_id and facility_i
     */
    assignLoansToFacilities(){
        this.assignments = this.loans.map((loan)=>{
            const facilitiesWithFundings = this.facilities.filter((facility)=>{
                return parseFloat(facility.amount) >= parseFloat(loan.amount)
            })
            const facilitiesFitCovenants = facilitiesWithFundings.filter((facility)=>{
                return this.meetCovenants(facility,loan)

            })
            const chosenFacility = facilitiesFitCovenants.reduce((minRateFacility,facility)=> parseFloat(facility.interest_rate) < parseFloat(minRateFacility.interest_rate) ? facility : minRateFacility,facilitiesFitCovenants[0])
        
            //decrease the chosen facility amount
            for(let i=0;i<this.facilities.length;i++){
                if(this.facilities[i].id == chosenFacility.id) this.facilities[i].amount= parseFloat(this.facilities[i].amount) - parseFloat(loan.amount)
            }
            if(loan && chosenFacility)
                return {loan: loan, facility: chosenFacility}
        })

    }
    /*
    name: meetCovenants
    arguments: facility, loan
    functionality: check if  a specific facility can fund a specific loan
        1 filter all rows in this.covenants that apply to either:
            -  a match in the facility id of the input and the facility_id in the row
            - if the input's facility id is not found in any row, filter the rows 
              with no facility id, but, with the input facility's bank_id(that is
               the case where covenant applies to all facilities in a bank)
        2. from the filtered covenants in step 1 filter all covenants that either:
            - max_default_likelihood < loan.default_likelihood OR
            - the 'state' is restricted from fundings
    */
    meetCovenants(facility,loan){
        const covenantsForFacility = this.covenants.filter((covenant)=>{
            if(covenant.facility_id){
                return (covenant.facility_id == facility.id)

            }else{  //no facility_id, the covenant is applied to all facilities in the bank
                return covenant.bank_id === facility.bank_id
            }
        })
        const covenantsForLoan = covenantsForFacility.filter((covenant)=>{
            return ((covenant.max_default_likelihood && parseFloat(covenant.max_default_likelihood) < parseFloat(loan.default_likelihood)) || (covenant.banned_state == loan.state) )
        })
        return covenantsForLoan.length ? false : true
    }
    /*
    name: facilityYieldCalculator
    arguments: none
    functionality: builds 'yields' class property
        1. go over class 'assignments' propery and for each one:
            1.1 calculate the expected yield according to required formula
            1.2 if there is no element in the class 'yields' property with the current facility id
                1.2.1 create a new entry in Yields with key=current facility id, value: expected yield
            1.3 else - there is already an entry in yields with key = current facility id
                1.3.1 increas the the value with the calculated expected yield
    */
    facilityYieldCalculator(){
        this.assignments.forEach((assignment)=>{
            
            if(assignment){
                const loanSuccessLikelyHood = (1 - parseFloat(assignment.loan.default_likelihood))
                const loanInterestRate = parseFloat(assignment.loan.interest_rate)
                const loanAmount = parseFloat(assignment.loan.amount)
                const lossAmountLikelihood = parseFloat(assignment.loan.default_likelihood * assignment.loan.amount)
                const facilityPaymentAmount = parseFloat(assignment.facility.interest_rate * assignment.loan.amount)
                const expectedYield = Math.round(loanSuccessLikelyHood * (loanInterestRate * loanAmount) - (lossAmountLikelihood) - (facilityPaymentAmount))
                if(!this.yields[assignment.facility.id]) this.yields[assignment.facility.id] = expectedYield
                else this.yields[assignment.facility.id] += expectedYield
            }
        })
    }
    /*
    name:setBookContent
    arguments: bookProperty - the property in "LoanBooks" to set the content
               content - csv content that was converted to a 2D array
    functionality: modified the 2D array to an array of objects
                   and assign to the suitable loanBook propery (banks/facilities/covenants/loans)
        1. extract the first array in the 2Dcontent array - these elements would be "keys" in the "loanBooks" property
        2. extract arrays in indexes: 1 -> content.length-2 (the last array in the content.length-1 is always empty)
        3. go over all arrays from 2nd step and for each one
            3.1 convert the array to be an object with keys taken from the array in 1st step and values would be the current array values
        4. set the suitable "bookProperty" with the converted data from previous steps
    */
    setBookContent(bookProperty="",content=""){
        if(!bookProperty.length || !content.length) return
        const keys = content[0];    //taking the first array these will be the keys in the array of objects
        const bookData = content.slice(1,content.length-1)
        let convertedBookData = bookData.map((row)=>{
            return row.reduce((rowObj,rowElem,idx)=>{
                if(rowElem === "") rowObj[keys[idx]]=null
                else rowObj[keys[idx]] = rowElem
                return rowObj
            },{})
        })
        //assigning to the suitable "LoanBooks" property
        switch(bookProperty){
            case "banks":
                this.banks = convertedBookData
                break
            case "facilities":
                this.facilities = convertedBookData
                break
            case "loans":
                this.loans = convertedBookData
                break
            case "covenants":
                this.covenants = convertedBookData
                break
            default:
                break
        }
    }/*
    name: convertAssignmentsToCSV
    arguments: none
    functionality:
        1. go over "LoanBooks" assignments property and conver to a 2D array
           where the first row contais the keys and all other rows conatin two elements: laon_id, facility_id
        2. conert the 2D array ro CSV
     */
    convertAssignmentsToCSV(){
        if(!this.assignments.length) return
        let assignmentsCSV = []
        assignmentsCSV[0] = ["loan_id","facility_id"]
        for(let i=0;i<this.assignments.length;i++){
            if(this.assignments[i]){
                assignmentsCSV[i+1] = [this.assignments[i].loan.id,this.assignments[i].facility.id]
            }
        }
        let csvContent = "data:text/csv;charset=utf-8," + assignmentsCSV.map(e => e.join(",")).join("\n");
        let encodedUri = encodeURI(csvContent);
        //downloading as csv
        let downloadLink = document.createElement("a");
        downloadLink.href = encodedUri;
        downloadLink.download = "assignments.csv";

        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
    /*
    name:  convertYieldsToCSV
    arguments: none
    functionality: 
        1. go over "LoanBooks" yields property and conver to a 2D array
           where the first row contais the keys and all other rows conatin two elements: facility id, expected yield
        2. conert the 2D array ro CSV
    */
    convertYieldsToCSV(){
        const yieldsKeys = Object.keys(this.yields)
        if(!yieldsKeys.length) return
        let yieldsCSV = []
        yieldsCSV[0] = ["facility_id","expected_yield"]
        for(let i=0;i<yieldsKeys.length;i++){
            yieldsCSV[i+1] = [yieldsKeys[i],this.yields[yieldsKeys[i]]]
            // if(this.yields[i]){
            //     assignmentsCSV[i+1] = [this.assignments[i].loan.id,this.assignments[i].facility.id]
            // }
        }
        let csvContent = "data:text/csv;charset=utf-8," + yieldsCSV.map(e => e.join(",")).join("\n");
        let encodedUri = encodeURI(csvContent);
        
        //downloading as csv
        let downloadLink = document.createElement("a");
        downloadLink.href = encodedUri;
        downloadLink.download = "yields.csv";

        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
}

//testing the small files
let smallBook = new LoanBooks()
smallBook.setDummyData()
smallBook.assignLoansToFacilities()
smallBook.facilityYieldCalculator()

let bigBook = new LoanBooks()

//event for uploading local csv files
const openFile = (event) => {
    let inputFile = event.target;
    let reader = new FileReader();
    reader.onload = () => {
        let data = Papa.parse(reader.result);
        bigBook.setBookContent(event.target.name,data.data)
    };
    reader.readAsText(inputFile.files[0]);
  };

  //an event handler when the user clicks on "calculate loan assignment"
  const calculateLoanAssignments = (event) =>{
    bigBook.assignLoansToFacilities()
    bigBook.facilityYieldCalculator()
  }
  
  //an event handler when the user clicks on: "Download Assignments and Yields"
  const downloadCSV = (event) =>{
      bigBook.convertAssignmentsToCSV()
      bigBook.convertYieldsToCSV()
  }
