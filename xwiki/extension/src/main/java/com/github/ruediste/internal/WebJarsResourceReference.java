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

import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import org.xwiki.resource.AbstractResourceReference;
import org.xwiki.resource.ResourceType;

/**
 * Represents a reference to a WebJar resource.
 */
public class WebJarsResourceReference extends AbstractResourceReference {
    public static final ResourceType TYPE = new ResourceType("lofimockups");

    public String wiki;
    public List<String> pageNames;
    public String attachment;
    public String zipPath;

    public WebJarsResourceReference(String wiki, List<String> pageNames, String attachment, String zipPath) {
        setType(TYPE);
        this.wiki = wiki;
        this.pageNames = pageNames;
        this.attachment = attachment;
        this.zipPath = zipPath;
    }

    @Override
    public String toString() {
        return ToStringBuilder.reflectionToString(this, ToStringStyle.SHORT_PREFIX_STYLE);
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(5, 5)
                .append(pageNames)
                .append(getType())
                .append(wiki)
                .append(getParameters())
                .append(attachment)
                .append(zipPath)
                .toHashCode();
    }

    @Override
    public boolean equals(Object object) {
        if (object == null) {
            return false;
        }
        if (object == this) {
            return true;
        }
        if (object.getClass() != getClass()) {
            return false;
        }
        WebJarsResourceReference rhs = (WebJarsResourceReference) object;
        return new EqualsBuilder()
                .append(pageNames, rhs.pageNames)
                .append(getType(), rhs.getType())
                .append(wiki, rhs.wiki)
                .append(getParameters(), rhs.getParameters())
                .append(attachment, rhs.attachment)
                .append(zipPath, rhs.zipPath)
                .isEquals();
    }
}
