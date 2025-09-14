package com.github.ruediste.lofi.xwiki;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;

import org.xwiki.component.annotation.Component;
import org.xwiki.model.reference.PageReference;
import org.xwiki.rest.XWikiResource;

@Component("com.github.ruediste.lofi.xwiki.LoFiRestResource")
@Path("/lofimockups/")
public class LoFiRestResource extends XWikiResource {

  // http://localhost:8078/rest/lofimockups/page?wiki=xwiki&page=LoFiTest&attachment=testProject.zip&pageNr=0
  @GET
  @Path("page")
  @Produces("image/png")
  public InputStream get(@QueryParam("wiki") String wiki, @QueryParam("page") String page,
      @QueryParam("attachment") String attachmentName, @QueryParam("pageNr") int pageNr) {
    try {
      var xcontext = xcontextProvider.get();
      var pageRef = new PageReference(wiki,
          Stream.of(page.split("/")).map(x -> URLDecoder.decode(x, StandardCharsets.UTF_8)).toList());
      var doc = xcontext.getWiki().getDocument(pageRef, xcontext);
      var attachment = doc.getAttachment(attachmentName);
      var is = attachment.getContentInputStream(xcontext);
      var zis = new ZipInputStream(is);
      ZipEntry entry;
      var zipPath = "pages/" + pageNr + ".png";
      while ((entry = zis.getNextEntry()) != null) {

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