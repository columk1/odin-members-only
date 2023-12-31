const { DateTime } = require('luxon')
const mongoose = require('mongoose')

const Schema = mongoose.Schema

const MessageSchema = new Schema(
  {
    title: { type: String, required: [true, 'Title is required'], unique: true, maxLength: 180 },
    // timestamp: { type: Date },
    text: { type: String, required: [true, 'Message text is required'], maxLength: 180 },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Author is required'] },
  },
  { timestamps: true }
)

MessageSchema.virtual('formatted_date').get(function () {
  return this.createdAt ? DateTime.fromJSDate(this.createdAt).toLocaleString(DateTime.DATE_MED) : ''
})

module.exports = mongoose.model('Message', MessageSchema)
