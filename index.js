import * as line from "@line/bot-sdk";
import * as dotenv from 'dotenv'
import express, { response } from 'express'
import axios from 'axios'
const app = express()

const { ACCESS_TOKEN, SECRET_TOKEN } = dotenv.config().parsed

const lineConfig = {
    channelAccessToken: ACCESS_TOKEN,
    channelSecret: SECRET_TOKEN
}

const client = new line.Client(lineConfig)

const greetingWord = 'สวัสดีลุง'
const startWord = 'รับออเดอร์'
const orderWord = 'เอา'
const finishWord = 'ปิดออเดอร์'

const orderListModel = {
    isOrdering: false,
    isAnswerWaiting: false, // รอเวอชั่นต่อไปให้ถามตอบได้ ตอนนีัช่างมัน
    orderTitle: null,
    order: [] //{userId : ,displayName: ,orderName :}
}

let orderList = []

const noneStageMessageAction = async (userId, msg, displayName, groupIndex) => {
    let reply = null
    if (msg === greetingWord) {
        reply = `สวัสดีคุณ ${displayName}
        
        หากต้องการให้ผมจดออเดอร์ ให้พิมพ์คำว่า ${startWord} ตามด้วยสิ่งที่อยากให้ผมจดออเดอร์ได้เลยครับ
        เช่น *** ${startWord} กาแฟ ***
        ครับผม : D`
    }
    else if (msg.includes(startWord)) {
        const orderTitle = msg.replace(startWord, "")
        orderList[groupIndex].isOrdering = true
        orderList[groupIndex].orderTitle = orderTitle

        reply = `ได้ครับ เพื่อนๆ ทุกคนในกลุ่มต้องการสั่ง ${orderTitle} เมนูอะไร
พิมพ์ ${orderWord} ตามด้วยชื่อเมนูมาได้เลยครับ(เช่น ${orderWord} ลาเต้หวานน้อย) เดี๋ยวผมจดให้ครับ: D

        ปล.ถ้าสั่งกันครบแล้ว ให้พิมพ์ ปิดออเดอร์ นะครับผม`
    }
    else {
        reply = null

    }
    return reply
}

const OrderingStageMessageAction = async (userId, msg, displayName, groupIndex) => {
    let reply = null
    if (msg.includes(startWord)) {
        reply = `ขออภัยด้วยครับ ขณะนี้กำลังรับออเดอร์ ${orderList.orderTitle} อยู่ครับ

หากต้องการให้ผมจดออเดอร์ใหม่ ให้พิมพ์ ปิดออเดอร์ นะครับผม`
    }
    else if (msg === finishWord) {
        reply = `เย้! ออเดอร์ ${orderList[groupIndex].orderTitle} ครบถ้วนแล้ว ขออนุญาตไปพักผ่อนก่อนนะครับ`
        orderList[groupIndex].isOrdering = false
        orderList[groupIndex].orderTitle = null
        orderList[groupIndex].order = []
    }
    else if ((msg.substring(0, orderWord.length) == orderWord) && msg.length > orderWord.length) {
        const orderName = msg.replace(orderWord, '')

        const thisIndex = orderList[groupIndex].order.findIndex(o => o.userId == userId)
        if (thisIndex > -1) { // found this user in order, update menu(orderName)
            orderList[groupIndex].order[thisIndex].orderName = orderName
        }
        else { // add new 
            orderList[groupIndex].order.push({ userId, displayName, orderName })
        }
        reply = `ออเดอร์ ${orderList[groupIndex].orderTitle} ทั้งหมด \n`
        orderList[groupIndex].order.map((userOrder) => {
            reply = reply.concat(`คุณ ${userOrder.displayName} สั่ง => ${userOrder.orderName} \n`)
        })
    } else {
        reply = null
    }
    return reply
}

const handleEvent = async (event) => {
    const userId = event.source.userId
    const groupId = event.source.groupId
    const msg = event.message.text

    let thisReply
    if (event.type !== 'message' || event.message.type !== 'text') {
        return null
    }
    else if (event.source.type != 'group') {
        return client.replyMessage(event.replyToken, { type: 'text', text: 'ขออภัยด้วยครับ แต่นายสั่งคนเดียวจะมาฝากเราทำไม ปัดโท่' })
    }
    else if (event.type === 'message') {
        await axios({
            method: "get",
            url:
                `https://api.line.me/v2/bot/group/${groupId}/member/${userId}`,
            timeout: 5000, // 5 seconds timeout
            headers: {
                'Authorization': 'Bearer ' + ACCESS_TOKEN
            },
        }).then(async (response) => {
            const displayName = response.data.displayName

            let thisGroupIndex = orderList.findIndex(group => group.groupId == groupId)
            if (thisGroupIndex == -1) {
                // new group, create group-order Object
                orderList.push({ groupId: Object.assign({}, orderListModel) })
                thisGroupIndex = orderList.findIndex(groupId => groupId == groupId)
            }
            if (orderList[thisGroupIndex].isOrdering) {
                thisReply = await OrderingStageMessageAction(userId, msg, displayName, thisGroupIndex)
            }
            else {
                thisReply = await noneStageMessageAction(userId, msg, displayName, thisGroupIndex)
            }

            return thisReply == null ? null : client.replyMessage(event.replyToken, { type: 'text', text: thisReply })
        }).catch((error) => {
            console.error(error);
            return null
        })
    }
}

app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
    try {
        const events = req.body.events
        console.log('event=>>>>', events)
        return events.length > 0 ? await events.map(item => handleEvent(item)) : res.status(200).send("OK")
    } catch (error) {
        res.status(500).end()
    };
});

app.listen((process.env.HOST, process.env.PORT), () => {
    console.log(`Running on http://${process.env.HOST}:${process.env.PORT}`);
});