import express from 'express'

const factory = (trifid) => {
  const { directory } = trifid.config
  if (!directory) {
    throw new Error("configuration is missing 'directory' field")
  }
  return express.static(directory)
}

export default factory
