# ios-manifester-lambda

A simple lambda service that you can easily deploy with [zeit now](https://zeit.co/now).

## The problem

I created this lambda because I wanted to store iOS enterprise distribution app on [Firebase Storage](https://firebase.google.com/docs/storage/). And because this is an enterprise distribution, you may want to ask the user to authenticate before they can get the app on their phones.

> Of course I have considered to put the whole thing directly on Zeit's now platform. I even created a fork of zeit's `@now/node` builder which allows you to keep some static files in the lambda so that you can use basic authentication to get them. Unfortunately, Zeit lambdas limit the size of the request/response body. In the end, my file turned out to be just to big (around 11MB) to be served as part of the lambda.

So, once you are authenticated on Firebase, you can call the storage API to get a *download link*:

```javascript
import firebase from 'firebase/app'
import 'firebase/storage'

const storage = firebase.storage()
const storageRef = this.storage.ref()
const fileRef = this.storageRef.child('App.ipa')

fileRef.getDownloadURL().then(console.log)
```

The `getDownloadURL` function throws an error if you are not
authenticated.

In you enterprise app distribution, you will have four files in total:

1. The actual app *ipa* file.
3. A display image.
4. A full size image.
2. The `manifest.plist` file containing urls pointing to the ipa file, the display image, and the full size image.

See also original [Apple Developer documentation](https://help.apple.com/deployment/ios/#/apda0e3426d7).

Then somewhere on your page, you put an anchor or a button with `href` being a so called `itms-services` link. For example:

```html
<a href="itms-services://?action=download-manifest&url=https://example.com/manifest.plist">Install App</a>
```

The problem is that we do not have actual urls to the ipa and image files from Firebase before we authenticate. The download link contains an authentication token appended to it, like this:

```
https://firebasestorage.googleapis.com/v0/b/example-firebase-app.appspot.com/o/AppName.ipa?alt=media&token=<TOKEN>
```

We need to make sure that the url we put in the `itms-services` link points to a service that provided the actual urls for the ipa, display, and full size images, returns a correct manifest file containing the authenticated Firebase download urls.

This exactly what `ios-manifester-lambda` service is doing.

## Creating the itms-services link

The following Javascript code can be used as an example of how to create a correctly encoded itms-services url. The encoding is tricky, and if you make a mistake, the iOS
device may simply ignore it.

```javascript
import firebase from 'firebase/app'
import 'firebase/storage'

const storage = firebase.storage()
const storageRef = this.storage.ref()

// you must be authenticated or it will throw
const getDownloadURL = fileName => {
  var fileRef = storageRef.child(fileName)

  return fileRef.getDownloadURL()
}

const encodeURIComponents = async ({ ipaFilename,
    displayImageName,
    fullSizeImageName }) => {
  const appUrl = encodeURIComponent(await this.getDownloadURL(ipaFilename))
  const displayImageUrl = encodeURIComponent(await this.getDownloadURL(displayImageName))
  const fullSizeImageUrl = encodeURIComponent(await this.getDownloadURL(fullSizeImageName))
  return {
    appUrlParam: encodeURIComponent(`appUrl=${appUrl}`),
    displayImageUrlParam: encodeURIComponent(`displayImageUrl=${displayImageUrl}`),
    fullSizeImageUrlParam: encodeURIComponent(`fullSizeImageUrl=${fullSizeImageUrl}`)
  }
}

const createItmsServicesLink = async dist => {
  const { appUrlParam,
    displayImageUrlParam,
    fullSizeImageUrlParam
  } = await this.encodeURIComponents(dist)

  const baseUrl = 'https://your-manifester.now.sh'
  return `itms-services://?action=download-manifest&url=${baseUrl}?${appUrlParam}%26${displayImageUrlParam}%26${fullSizeImageUrlParam}`
}

const itmsServicesLink = createItmsServicesLink({
  ipaFilename: 'Example.ipa'
  displayImageName: 'Manifest-57px.png',
  fullSizeImageName: 'Manifest-512px.png'
})

console.log('itmsServicesLink=', itmsServicesLink)
```

## Deploying on zeit

See the [examples](/examples) folder.
