# Mail Server

## 發送mail

- url: /api/mail
- method: post
- secret: 每個服務都會有自己的secret,做checksum使用
- body

```json
{
    "service":"test",
    "subject":"testsub",
    "html":"<ul><li>list1</li><li>list2</li><li>list3</li></ul>",
    "text":"test message",
    "target":["skynocover@Gmail.com"],
    "datetime":"2021-08-31T16:51:19.808Z",
    "checksum":"${service}${subject}${datetime}${secret}"
}
```

- service: 每個服務各自的代號
- subject: mail標題
- html / text: mail內容, 兩個只能選一個, 且只能有其中一個
- target: mail收信人, 陣列
- datetime: 時間格式, 須為ISOString, 且距離現在不能少於30分鐘

## 取得發送歷程

- url: /api/mail
- method: get
- secret: 每個服務都會有自己的secret,做checksum使用 
- query
  - service: 每個服務各自的代號
  - durationStart: 搜尋起始時間(ISOString格式)
  - durationEnd: 搜尋結束時間(ISOString格式)
  - checksum: "${service}${durationStart}${durationEnd}${secret}"
  - limit?: 搜尋數量,上限100
  - offset?: 搜尋的略過數量