function NotFound() {
  return <p>404 - Page Not Found</p>
}

NotFound.getInitialProps = () => {
  return { statusCode: 404 }
}

export default NotFound
