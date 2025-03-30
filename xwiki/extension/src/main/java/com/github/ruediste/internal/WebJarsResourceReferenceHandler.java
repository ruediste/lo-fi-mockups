/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 */
package com.github.ruediste.internal;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import javax.inject.Inject;
import javax.inject.Named;
import javax.inject.Provider;
import javax.inject.Singleton;

import org.xwiki.component.annotation.Component;
import org.xwiki.model.reference.PageReference;
import org.xwiki.resource.ResourceType;
import org.xwiki.resource.annotations.Authenticate;
import org.xwiki.resource.servlet.AbstractServletResourceReferenceHandler;

import com.xpn.xwiki.XWikiContext;

/**
 * Handles {@code webjars} Resource References.
 *
 * @version $Id: 76d1b35127a17f53afb8cc86d2557c60ab8fe1a9 $
 * @since 6.1M2
 * @see WebJarsResourceReferenceResolver for the URL format handled
 */
@Component
@Named("lofimockups")
@Singleton
@Authenticate
public class WebJarsResourceReferenceHandler extends AbstractServletResourceReferenceHandler<WebJarsResourceReference> {

    @Inject
    private Provider<XWikiContext> xcontextProvider;

    @Override
    public List<ResourceType> getSupportedResourceReferences() {
        return Arrays.asList(WebJarsResourceReference.TYPE);
    }

    @Override
    protected InputStream getResourceStream(WebJarsResourceReference resourceReference) {
        System.out.println("getResourceStream() " + resourceReference);
        try {
            var xcontext = xcontextProvider.get();
            var pageRef = new PageReference(resourceReference.wiki, resourceReference.pageNames);
            var doc = xcontext.getWiki().getDocument(pageRef, xcontext);
            var attachment = doc.getAttachment(resourceReference.attachment);
            var is = attachment.getContentInputStream(xcontext);
            var zis = new ZipInputStream(is);
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {

                System.out.println("getResourceStream() <" + entry.getName() + ">");
                if (entry.getName().equals(resourceReference.zipPath)) {
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
            throw new RuntimeException("Entry " + resourceReference.zipPath + " no found");
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    protected String getResourceName(WebJarsResourceReference resourceReference) {
        return resourceReference.zipPath;
    }
}
