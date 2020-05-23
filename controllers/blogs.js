const blogsRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const Blog = require('../models/blog')
const User = require('../models/user')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({})
    .populate('user', { username: 1, name: 1 })
  response.json(blogs.map(blog => blog.toJSON()))
})

blogsRouter.post('/', async (request, response, next) => {
  const body = request.body
  const token = request.token

  const decodeToken = await jwt.verify(token, process.env.SECRET)

  if (!token || !decodeToken) return next()

  if (!body.title || !body.url) {
    const error = {
      name: 'BadRequestError',
      message: 'bad request'
    }
    return next(error)
  }

  const user = await User.findById(decodeToken.id)

  const newBlog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes | 0,
    comments: [],
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

blogsRouter.delete('/:id', async (request, response, next) => {
  const id = request.params.id
  const token = request.token

  const decodeToken = jwt.verify(token, process.env.SECRET)
  const userid = decodeToken.id

  if (!token || !decodeToken) return next()

  const blog = await Blog.findById(id)

  if (!blog) {
    const error = {
      name: 'ResourceNotFoundError',
      message: 'not found'
    }
    return next(error)
  }

  if (blog.user.toString() !== userid) {
    const error = {
      name: 'NotAuthorizedError',
      message: 'not authorized'
    }
    return next(error)
  }

  const user = await User.findById(blog.user.toString())
  await User.findByIdAndUpdate(
    user._id.toString(),
    { $pull: { blogs: blog._id } }
  )

  await Blog.findByIdAndRemove(blog._id)
  response.status(204).end()
})

blogsRouter.get('/:id/comments', async (request, response) => {
  const id = request.params.id

  const blog = await Blog
    .findById(id.toString())

  response.json(blog.comments)
})

blogsRouter.post('/:id/comments', async (request, response, next) => {
  const id = request.params.id
  const body = request.body

  if (!body.content) {
    const error = {
      name: 'BadRequestError',
      message: 'bad request'
    }
    return next(error)
  }

  const savedComment = await Blog.findOneAndUpdate(
    { _id: id.toString() },
    { $push: { comments: body.content } },
    { new: true }
  )

  response.status(201).json(savedComment)
})

module.exports = blogsRouter
