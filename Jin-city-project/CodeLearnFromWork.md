2022.5.6
Trick: when it comes to the format of {__ob__: Observer}
            array can be transformed from way of JSON.parse(JSON.stringify(this.list))

5.7
Trick: Data transmit from parent to child:
        child.vue: 
            props: {
                testData: {
                    type: Object,
                    default: {}
                    }
                }
        parent.vue：
            :testData="testData",(child.vue cannot receive the data without ":")

    Duplicate same data from arr:
        Array.from(new Set(arr))
            eg: let arr = [a,b,c,c,d]
                let set = new Set(arr)
                let newArr = Array.from(set)
                console.log(newArr) //[a,b,c,d]

    Collect all of id from array of object and then form a new array 
        let ids = arrData.map((item) => {
                    return item.id
                    })
        console.log(ids)