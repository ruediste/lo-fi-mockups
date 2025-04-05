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
package com.github.ruediste.lofi.xwiki;

import org.xwiki.model.reference.AttachmentReference;
import org.xwiki.properties.annotation.PropertyDescription;
import org.xwiki.properties.annotation.PropertyMandatory;

/**
 * Parameters for the {@link com.github.ruediste.lofi.xwiki.ExampleMacro} Macro.
 */
public class ShowMockupPageMacroParameters {
    private int pageNr;

    public int getPageNr() {
        return this.pageNr;
    }

    @PropertyMandatory
    @PropertyDescription("Number of the page to show")
    public void setPageNr(int pageNr) {
        this.pageNr = pageNr;
    }

    private AttachmentReference mockup;

    public AttachmentReference getMockup() {
        return mockup;
    }

    @PropertyMandatory
    @PropertyDescription("Attachment containing the Mockup")
    public void setMockup(AttachmentReference value) {
        mockup = value;
    }
}
