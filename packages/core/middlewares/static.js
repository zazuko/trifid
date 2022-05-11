import express from 'express'

const factory = (trifid) => {
  return express.static(process.cwd())
}

export default factory
