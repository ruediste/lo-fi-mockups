package com.github.ruediste.internal;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;

import org.xwiki.component.annotation.Component;
import org.xwiki.model.reference.PageReference;
import org.xwiki.rest.XWikiResource;

@Component("com.github.ruediste.internal.LoFiRestResource")
@Path("/lofimockups/")
public class LoFiRestResource extends XWikiResource {

  // http://localhost:8078/rest/lofimockups/page?wiki=xwiki&page=LoFiTest&attachment=testProject.zip&zipPath=testProject%2Ftest.jpg
  @GET
  @Path("page")
  @Produces("image/jpeg")
  public InputStream get(@QueryParam("wiki") String wiki, @QueryParam("page") String page,
      @QueryParam("attachment") String attachmentName, @QueryParam("zipPath") String zipPath) {
    System.out.println("get() ");
    try {
      var xcontext = xcontextProvider.get();
      var pageRef = new PageReference(wiki, List.of(page.split("/")));
      var doc = xcontext.getWiki().getDocument(pageRef, xcontext);
      var attachment = doc.getAttachment(attachmentName);
      var is = attachment.getContentInputStream(xcontext);
      var zis = new ZipInputStream(is);
      ZipEntry entry;
      while ((entry = zis.getNextEntry()) != null) {

        System.out.println("getResourceStream() <" + entry.getName() + ">");
        if (entry.getName().equals(zipPath)) {
          return new InputStream() {
            @Override
            public int read() throws IOException {
              return zis.read();
            }

            @Override
            public int read(byte[] b) throws IOException {
              return zis.read(b);
            }

            @Override
            public int read(byte[] b, int off, int len) throws IOException {
              return zis.read(b, off, len);
            }
          };
        }
      }
      zis.close();
      throw new RuntimeException("Entry " + zipPath + " no found");
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }
}