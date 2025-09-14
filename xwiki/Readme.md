# XWiki Plugin

## Extension Development

Run the `Build XWiki extension` VS Code task. It will build the extension with a new version. Open the extension manager in xwiki, click on `More` and `Advanced Search`. Enter the extension id
`com/github/ruediste/lo-fi-mockups:lo-fi-mockups-xwiki` and the latest version you built.

Alternatively, you can use this URL and tweak it:

```url
http://localhost:8078/bin/admin/XWiki/XWikiPreferences?section=XWiki.Extensions&extensionId=com%2Fgithub%2Fruediste%2Flo-fi-mockups%3Alo-fi-mockups-xwiki&extensionVersion=1.0.57-SNAPSHOT
```

## Frontend Development

To develop the frontend, the easiest way is to start the dev server, install the extension, add a LoFi Mockup and extract everything after the `#` from the URL. Add that to the URL of the development server, and the frontend will behave exactly as the if it was deployed in Xwiki itself.
