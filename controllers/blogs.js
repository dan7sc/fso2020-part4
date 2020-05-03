const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', async (request, response) => {
  await Blog
    .find({})
    .then(blogs => {
      response.json(blogs)
    })
})

blogsRouter.post('/', async (request, response) => {
  const body = request.body
  if (body.likes === undefined) {
    body.likes = 0
  }
  if (!body.title || !body.url) {
    return response.status(400).json({error: 'bad request'})
  }
  const blog = new Blog(body)

  await blog
    .save()
    .then(result => {
      response.status(201).json(result)
    })
})

blogsRouter.delete('/:id', async (request, response) => {
  const id = request.params.id

  await Blog.findByIdAndRemove(id)
  response.status(204).end()
})

module.exports = blogsRouter
