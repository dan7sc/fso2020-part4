const supertest = require('supertest')
const mongoose = require('mongoose')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')

beforeEach(async () => {
  await Blog.deleteMany({})

  const blogObjects = helper.initialBlogs
    .map(blog => new Blog(blog))
  const promiseArray = blogObjects.map(blog => blog.save())
  await Promise.all(promiseArray)
})

describe('when there is initially some blogs saved', () => {
  test('blogs are returned as json', async () => {
    const response = await api.get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })

  test('unique identifier property of the blog posts is named id', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body[0].id).toBeDefined()
  })
})

describe('addition of a new blog', () => {
  test('succeeds with a valid data', async () => {
    const newBlog = {
        title: 'Testing post a new blog',
        author: 'Tester',
        url: 'http://www.example.com',
        likes: 0
    }
    await api.post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

    const titles = blogsAtEnd.map(blog => blog.title)
    expect(titles).toContain('Testing post a new blog')
  })

  test('if likes property is missing the default value is zero', async () => {
    const newBlog = {
      title: 'Post a new blog without likes property',
      author: 'Tester',
      url: 'http://www.example.com'
    }
    await api.post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    const size = helper.initialBlogs.length
    expect(blogsAtEnd).toHaveLength(size + 1)
    expect(blogsAtEnd[size].likes).toBeDefined()
    expect(blogsAtEnd[size].likes).toBe(0)
  })
})

afterAll(() => {
  mongoose.connection.close()
})
