2022

5.6
Trick: when it comes to the format of {__ob__: Observer}
            array can be transformed from way of 
                JSON.parse(JSON.stringify(this.list))

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
        console.log(ids) //ids will collect all id data and return a new arr of ids

5.10
Trick: Find out all objects that meet the requirements in array
        1.  let obj = response.rows // response.rows is data from back end 
            let a = []
            obj.forEach((ele) => {
                if (ele.roleType == 1) {
                a.push(ele)
                }
            })
            console.log(a) 

        2.  let a = arr.filter((ele) => ele.a == 2)
        both ways can realize the function
        
5.12 
Trick: In vue, data should be set at data and display in template
        eg: <el-row class="tips">
              <el-col :span="item.col" v-for="item in tips" :key="item.value">
                <div class="circleTip">
                  <span
                    class="circle"
                    v-show="item.type === 'circle'"
                    :style="{ 'background-color': item.color }"
                  ></span>
                  <i
                    class="el-icon-info icon-item"
                    v-show="item.type === 'icon'"
                    :style="{ color: item.color }"
                  ></i>
                  <span class="tip">{{ item.value }}</span>
                </div>
              </el-col>
            </el-row>
         
        <---------->
        data(){
         return:{
             tips: [
        {
          col: 2,
          type: 'circle',
          color: '#C3CAD9',
          value: '未到提交时间'
        },
        {
          col: 2,
          type: 'circle',
          color: '#E6A23C',
          value: '未提交数据'
        },
        {
          col: 2,
          type: 'circle',
          color: '#5DB879',
          value: '已提交数据'
        },
        {
          col: 3,
          type: 'icon',
          color: '#409EFF',
          value: '该指标的上报说明'
        },
      ],
     }
    }
