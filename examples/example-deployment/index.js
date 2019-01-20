const { Manifester } = require('ios-manifester-lambda')

module.exports = (req, res) => {
  const manifester = new Manifester({
    bundleId: 'com.example.ExampleApp',
    bundleVersion: '1.0',
    title: 'ExampleApp'
  })
  manifester.serve(req, res)
}
