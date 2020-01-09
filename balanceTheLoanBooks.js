class LoanBooks{
    constructor(){
        this.loans=[]
        this.facilities=[]
        this.covenants=[]
        this.banks=[]
        this.assignments=[]
        this.yields={}
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
    arguments: none - using the class attributes
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
                return facility.amount >= loan.amount
            })
            const facilitiesFitCovenants = facilitiesWithFundings.filter((facility)=>{
                return this.meetCovenants(facility,loan)

            })
            const chosenFacility = facilitiesFitCovenants.reduce((minRateFacility,facility)=> facility.interest_rate < minRateFacility.interest_rate ? facility : minRateFacility,facilitiesFitCovenants[0])

            //decrease the chosen facility amount
            for(let i=0;i<this.facilities.length;i++){
                if(this.facilities[i].id == chosenFacility) this.facilities[i].amount-=loan.amount
            }

           
            console.log("loan: ", loan)
            console.log("cosen facility: ", chosenFacility)
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
            return ((covenant.max_default_likelihood && covenant.max_default_likelihood < loan.default_likelihood) || (covenant.banned_state == loan.state) )
        })
        return covenantsForLoan.length ? false : true
    }
    facilityYieldCalculator(){
        this.assignments.forEach((assignment)=>{
            // const defaultLikelihood = 
            // const loanInterestRate=
            // const loanAmount=
            // const facilityInterestRate=
            debugger
            
            const expectedYield = Math.round((1 - assignment.loan.default_likelihood) * (assignment.loan.interest_rate * assignment.loan.amount) - (assignment.loan.default_likelihood * assignment.loan.amount) - (assignment.facility.interest_rate * assignment.loan.amount))
            if(!this.yields[assignment.facility.id]) this.yields[assignment.facility.id] = expectedYield
            else this.yields[assignment.facility.id] += expectedYield
        })
        console.log(this.yields)
    }
}

let a = new LoanBooks()
a.setDummyData()
a.assignLoansToFacilities()
console.log(a.assignments)
a.facilityYieldCalculator()
