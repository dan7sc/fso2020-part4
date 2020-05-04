const blogsRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const Blog = require('../models/blog')
const User = require('../models/user')

const getTokenFrom = (request) => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7)
  }
  return null
}

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({})
    .populate('user', { username: 1, name: 1 })
  response.json(blogs.map(blog => blog.toJSON()))
})

blogsRouter.post('/', async (request, response) => {
  const body = request.body
  const token = getTokenFrom(request)
  const decodeToken = await jwt.verify(token, process.env.SECRET)

  if (!token || !decodeToken) {
    return response.status(400).json({ error: 'invalid token' })
  }

  if (!body.title || !body.url) {
    return response.status(400).json({ error: 'bad request' })
  }

  const user = await User.findById(decodeToken.id)

  const newBlog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes | 0,
    user: user._id
  }

  const blog = new Blog(newBlog)

  const savedBlog = await blog.save()

  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()

  response.status(201).json(savedBlog.toJSON())
})

blogsRouter.put('/:id', async (request, response) => {
  const id = request.params.id
  const body = request.body

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes
  }

  const updatedBlog = await Blog.findByIdAndUpdate(id, blog, { new: true })
  response.json(updatedBlog)
})

blogsRouter.delete('/:id', async (request, response) => {
  const id = request.params.id

  await Blog.findByIdAndRemove(id)
  response.status(204).end()
})

module.exports = blogsRouter
