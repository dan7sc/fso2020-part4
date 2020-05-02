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

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog
}
