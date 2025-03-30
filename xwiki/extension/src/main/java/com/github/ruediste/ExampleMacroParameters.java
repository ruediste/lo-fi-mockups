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
package com.github.ruediste;

import org.xwiki.model.reference.AttachmentReference;
import org.xwiki.properties.annotation.PropertyDescription;
import org.xwiki.properties.annotation.PropertyMandatory;

/**
 * Parameters for the {@link com.github.ruediste.internal.ExampleMacro} Macro.
 */
public class ExampleMacroParameters {
    private String parameter;

    public String getParameter() {
        return this.parameter;
    }

    @PropertyMandatory
    @PropertyDescription("Example parameter")
    public void setParameter(String parameter) {
        this.parameter = parameter;
    }

    private AttachmentReference ref;

    public AttachmentReference getRef() {
        return ref;
    }

    @PropertyMandatory
    @PropertyDescription("Attachment")
    public void setRef(AttachmentReference value) {
        ref = value;
    }
}
