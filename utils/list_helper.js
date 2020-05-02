const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => {
    return sum + blog.likes
  }, 0)
}

const favoriteBlog = (blogs) => {
  let maxLikes = -1
  let blogWithMostLikes = {}
  blogs.forEach(blog => {
    if (blog.likes > maxLikes) {
      maxLikes = blog.likes
      blogWithMostLikes = blog
    }
  })

  delete blogWithMostLikes._id
  delete blogWithMostLikes.url
  delete blogWithMostLikes.__v
  return blogWithMostLikes
}

// const favoriteBlog = (blogs) => {
//   return Math.max(
//     ...blogs.map(blog => {
//       return blog.likes
//     })
//   )
// }

const mostBlogs = (blogs) => {
  const numberOfBlogsByAuthor = {}
  const authorWithMostBlogs = {}
  let max = -1
  blogs.forEach(blog => {
    if (numberOfBlogsByAuthor.hasOwnProperty(blog.author)) {
      numberOfBlogsByAuthor[blog.author] += 1
    } else {
      numberOfBlogsByAuthor[blog.author] = 1
    }
  })
  for(let key in numberOfBlogsByAuthor) {
    if (numberOfBlogsByAuthor[key] > max) {
      max = numberOfBlogsByAuthor[key]
      authorWithMostBlogs.author = key
      authorWithMostBlogs.blogs = max
    }
  }
  return authorWithMostBlogs
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs
}
