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

import java.util.List;
import java.util.Map;

import javax.inject.Named;
import javax.inject.Singleton;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xwiki.component.annotation.Component;
import org.xwiki.resource.CreateResourceReferenceException;
import org.xwiki.resource.ResourceType;
import org.xwiki.resource.UnsupportedResourceReferenceException;
import org.xwiki.url.ExtendedURL;
import org.xwiki.url.internal.AbstractResourceReferenceResolver;

/**
 * Transform WebJars URL into a typed Resource Reference. The URL format handled
 * is
 * {@code http://server/context/webjars/path/to/resource[?version=<version>][&evaluate=true|false]}.
 * For example:
 * {@code http://localhost:8080/xwiki/webjars/angularjs/1.1.5/angular.js}.
 *
 * @version $Id: 688137a048679dc95927a4b8d7f921883b61cfec $
 * @since 7.1M1
 */
@Component
@Named("lofimockups")
@Singleton
public class WebJarsResourceReferenceResolver extends AbstractResourceReferenceResolver {

    private static final Logger LOGGER = LoggerFactory.getLogger(WebJarsResourceReferenceResolver.class);

    public WebJarsResourceReferenceResolver() {
        System.out.println("WebJarsResourceReferenceResolver.ctor()");
        LOGGER.info("ctor");
    }

    // http://localhost:8078/lofimockups/xwiki/1/LoFiTest/testProject.zip/testProject%2Ftest.jpg
    @Override
    public WebJarsResourceReference resolve(ExtendedURL extendedURL, ResourceType resourceType,
            Map<String, Object> parameters)
            throws CreateResourceReferenceException, UnsupportedResourceReferenceException {
        WebJarsResourceReference reference;
        List<String> segments = extendedURL.getSegments();

        if (segments.size() > 1) {
            int idx = 0;
            String wiki = segments.get(idx++);
            int pageNameCount = Integer.parseInt(segments.get(idx++));

            // The other segments point to the resource path
            List<String> pageNames = segments.subList(idx, idx + pageNameCount);
            idx += pageNameCount;
            String attachment = segments.get(idx++);
            String zipPath = segments.get(idx++);

            reference = new WebJarsResourceReference(wiki, pageNames, attachment, zipPath);
            copyParameters(extendedURL, reference);
        } else {
            throw new CreateResourceReferenceException(String.format("Invalid WebJars URL format [%s]",
                    extendedURL.toString()));
        }
        return reference;
    }
}
