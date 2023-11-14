// @ts-check
import express from 'express'

/** @type {import('../types/index.d.ts').TrifidMiddleware} */
const factory = (trifid) => {
  const { directory } = trifid.config
  if (!directory) {
    throw new Error("configuration is missing 'directory' field")
  }
  return express.static(directory)
}

export default factory
