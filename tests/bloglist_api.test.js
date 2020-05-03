const supertest = require('supertest')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const User = require('../models/user')

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

  test('if title and url properties are missing return bad request', async () => {
    const newBlog = {
      author: 'Tester',
      likes: 1
    }
    await api.post('/api/blogs')
      .send(newBlog)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  })
})

describe('update of a blog', () => {
  test('change amount of likes', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]
    blogToUpdate.likes = 3

    await api.put(`/api/blogs/${blogToUpdate.id}`)
      .send(blogToUpdate)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(
      helper.initialBlogs.length
    )
    expect(blogsAtEnd[0].likes).toBe(blogToUpdate.likes)
  })
})

describe('deletion of a blog', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api.delete(`/api/blogs/${blogToDelete.id}`)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(
      helper.initialBlogs.length - 1
    )

    const titles = blogsAtEnd.map(blog => blog.title)
    expect(titles).not.toContain(blogToDelete.title)
  })
})

describe('when there initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('toorin', 10)
    const user = new User({
      username: 'root',
      name: 'root',
      passwordHash
    })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen'
    }
    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    const size = usersAtStart.length
    expect(usersAtEnd.length).toBe(size + 1)
    expect(usersAtEnd[size].username).toContain('mluukkai')
  })

  test('creation fails with a username length < 3 characters', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'lu',
      name: 'Mattios Lukacs',
      password: 'salainen'
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(response.body.error).toContain('username and password must be at least 3 characters long')

    const usersAtEnd = await helper.usersInDb()
    const size = usersAtStart.length
    expect(usersAtEnd.length).toBe(size)
    expect(usersAtEnd[size]).not.toBeDefined()
  })

  test('creation fails with a password < 3 characters', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'luka',
      name: 'Mattios Lukacs',
      password: 'sa'
    }
    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(response.body.error).toContain('username and password must be at least 3 characters long')

    const usersAtEnd = await helper.usersInDb()
    const size = usersAtStart.length
    expect(usersAtEnd.length).toBe(size)
    expect(usersAtEnd[size]).not.toBeDefined()
  })

  test('creation fails with username is not unique', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'root two',
      password: 'owttoor'
    }
    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(response.body.error).toContain('Error, expected \`username\` to be unique')

    const usersAtEnd = await helper.usersInDb()
    const size = usersAtStart.length
    expect(usersAtEnd.length).toBe(size)
    expect(usersAtEnd[size]).not.toBeDefined()
  })
})

afterAll(() => {
  mongoose.connection.close()
})
